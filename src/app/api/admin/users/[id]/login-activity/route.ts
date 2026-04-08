import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Activity } from '@/models';

// GET /api/admin/users/[id]/login-activity - Get user login activity
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
    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Get login activities for this user
    const activities = await Activity.find({ 
      actor: id,
      action: { $in: ['login', 'logout', 'login_failed'] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse(
      { 
        activities,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      },
      'Login activity retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/users/[id]/login-activity - Clear user login activity
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

    // Delete all login activities for this user
    const result = await Activity.deleteMany({ 
      actor: id,
      action: { $in: ['login', 'logout', 'login_failed'] }
    });

    return successResponse(
      { deletedCount: result.deletedCount },
      'Activity cleared successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
