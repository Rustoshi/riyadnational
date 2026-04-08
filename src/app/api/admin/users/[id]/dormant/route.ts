import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { UserStatus } from '@/types';

// POST /api/admin/users/[id]/dormant - Mark account as dormant (inactive)
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

    // Mark account as dormant (inactive)
    user.status = UserStatus.DORMANT;
    await user.save();

    return successResponse(
      { status: user.status },
      'Account marked as dormant successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/users/[id]/dormant - Reactivate account from dormant
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
    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Reactivate account from dormant
    user.status = UserStatus.ACTIVE;
    await user.save();

    return successResponse(
      { status: user.status },
      'Account reactivated from dormant successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
