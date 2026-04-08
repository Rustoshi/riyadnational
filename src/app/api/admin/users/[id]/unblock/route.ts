import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { UserStatus } from '@/types';

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

    user.status = UserStatus.ACTIVE;
    await user.save();

    return successResponse(null, 'User unblocked successfully');
  } catch (error) {
    return handleError(error);
  }
}
