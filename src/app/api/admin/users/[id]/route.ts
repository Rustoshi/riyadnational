import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Transaction } from '@/models';
import { sanitizeUser, hashPassword } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const user = await User.findById(id).lean();

    if (!user) {
      return notFoundResponse('User not found');
    }

    // Get recent transactions for this user
    const transactions = await Transaction.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // For admin, return user with sensitive fields (except password)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userForAdmin = { ...(user as any) };
    delete userForAdmin.password;
    delete userForAdmin.twoFactorSecret;

    return successResponse(
      { user: userForAdmin, transactions },
      'User retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const body = await request.json();

    console.log('[Update User] Received body:', JSON.stringify(body, null, 2));
    console.log('[Update User] createdAt value:', body.createdAt);

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Capture original status BEFORE any mutations for email trigger logic
    const originalStatus = user.status;

    // Update allowed fields (must match User model field names)
    const allowedFields = [
      'name', 'email', 'phone', 'country', 'currency', 'address', 'city', 'zipCode',
      'dateOfBirth', 'accountType', 'accountNumber', 'balance', 'bitcoinBalance', 'pin', 'status',
      'dailyTransferLimit', 'dailyWithdrawalLimit', 'withdrawalFee',
      'cotCode', 'taxCode', 'imfCode', 'createdAt'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Hash PIN if it's being updated
        if (field === 'pin' && body[field]) {
          // Store PIN as plain text (requested feature)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (user as any)[field] = body[field];
        } else if (field === 'balance' || field === 'bitcoinBalance' || field === 'withdrawalFee' ||
          field === 'dailyTransferLimit' || field === 'dailyWithdrawalLimit') {
          // Convert numeric string fields to numbers
          const numValue = parseFloat(body[field]);
          if (!isNaN(numValue)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user as any)[field] = numValue;
          }
        } else if (field === 'createdAt') {
          // createdAt is handled separately due to timestamps option
          // Skip here, will update directly after save
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (user as any)[field] = body[field];
        }
      }
    }

    try {
      await user.save();

      // Handle createdAt separately - use direct MongoDB collection update to bypass Mongoose timestamps
      if (body.createdAt) {
        const dateValue = new Date(body.createdAt);
        console.log('[Update User] Attempting to update createdAt:', body.createdAt, '-> Date:', dateValue);
        if (!isNaN(dateValue.getTime())) {
          // Use the underlying MongoDB collection to bypass Mongoose middleware
          const result = await User.collection.updateOne(
            { _id: user._id },
            { $set: { createdAt: dateValue } }
          );
          console.log('[Update User] MongoDB update result:', result);
        }
      }
    } catch (saveError) {
      console.error('User save error:', saveError);
      if (saveError instanceof Error) {
        return errorResponse(saveError.message, 400);
      }
      return errorResponse('Failed to save user', 400);
    }

    // Fetch updated user to return
    const updatedUser = await User.findById(id);

    // Check if status changed to ACTIVE and send email
    if (updatedUser && body.status === 'active' && originalStatus !== 'active') {
      try {
        // Import dynamically to avoid circular dependencies if any
        const { EmailService } = await import('@/services/emailService');
        await EmailService.sendAccountApprovalEmail(updatedUser);
        console.log(`[Update User] Sent approval email to ${updatedUser.email}`);
      } catch (emailError) {
        console.error('[Update User] Failed to send approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return successResponse(
      sanitizeUser(updatedUser!.toObject()),
      'User updated successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
