import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { generateToken } from '@/lib/utils';

// POST /api/admin/users/[id]/login-as - Login as user (admin impersonation)
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

    // Generate a user token for the admin to use
    const userToken = generateToken({
      id: user._id.toString(),
      email: user.email,
      type: 'user',
    });

    return successResponse(
      { 
        token: userToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      },
      `You are now logged in as ${user.name}`
    );
  } catch (error) {
    return handleError(error);
  }
}
