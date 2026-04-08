import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';

// POST /api/admin/users/[id]/verify-email - Manually verify user email
export async function POST(
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
    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Update email verification status
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    return successResponse(
      { emailVerified: true, emailVerifiedAt: user.emailVerifiedAt },
      'User email has been verified'
    );
  } catch (error) {
    return handleError(error);
  }
}
