import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';

// PUT /api/admin/users/[id]/usage-limits - Update user usage limits
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

    const { dailyTransferLimit, dailyWithdrawalLimit } = body;

    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Update usage limits
    if (dailyTransferLimit !== undefined) {
      user.dailyTransferLimit = parseFloat(dailyTransferLimit);
    }
    if (dailyWithdrawalLimit !== undefined) {
      user.dailyWithdrawalLimit = parseFloat(dailyWithdrawalLimit);
    }
    
    await user.save();

    return successResponse(
      { 
        dailyTransferLimit: user.dailyTransferLimit,
        dailyWithdrawalLimit: user.dailyWithdrawalLimit
      },
      'User usage limits updated successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
