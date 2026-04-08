import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Activity } from '@/models';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { generateToken } from '@/lib/utils';
import { ActivityActorType, AdminRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    // Only super admins can impersonate
    if (admin.role !== AdminRole.SUPER_ADMIN) {
      return errorResponse('Only super admins can impersonate users', 403);
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Generate a token for the user
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      type: 'user',
    });

    // Log the impersonation
    await Activity.create({
      actor: admin._id,
      actorType: ActivityActorType.ADMIN,
      action: 'impersonate_user',
      resource: 'user',
      resourceId: user._id,
      details: { adminEmail: admin.email, userEmail: user.email },
    });

    // Sanitize user data
    const sanitizedUser = {
      _id: user._id,
      email: user.email,
      name: user.name,
      accountNumber: user.accountNumber,
      balance: user.balance,
      status: user.status,
    };

    return successResponse(
      {
        user: sanitizedUser,
        token,
        impersonatedBy: admin.email,
      },
      'Impersonation successful. You are now logged in as the user.'
    );
  } catch (error) {
    return handleError(error);
  }
}
