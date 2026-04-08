import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { hashPassword } from '@/lib/utils';

// Default password when admin resets user password (matching PHP: 'user01236')
const DEFAULT_PASSWORD = 'user01236';

// POST /api/admin/users/[id]/reset-password - Reset user password to default
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
    
    // Check if custom password is provided in request body
    let newPassword = DEFAULT_PASSWORD;
    try {
      const body = await request.json();
      if (body.password && body.password.length >= 6) {
        newPassword = body.password;
      }
    } catch {
      // No body provided, use default password
    }

    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Hash and update password
    user.password = await hashPassword(newPassword);
    await user.save();

    return successResponse(
      { defaultPassword: newPassword === DEFAULT_PASSWORD ? DEFAULT_PASSWORD : undefined },
      'Password has been reset to default'
    );
  } catch (error) {
    return handleError(error);
  }
}
