import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';
import { Admin } from '@/models';
import { hashPassword, comparePassword } from '@/lib/utils';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';

/**
 * PUT /api/admin/settings/password
 * Change admin password
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('All fields are required');
    }

    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters');
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('New passwords do not match');
    }

    if (currentPassword === newPassword) {
      return errorResponse('New password must be different from current password');
    }

    // Fetch admin with password field
    const adminDoc = await Admin.findById(admin._id);
    if (!adminDoc) {
      return errorResponse('Admin not found', 404);
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, adminDoc.password);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 403);
    }

    // Hash and save new password
    adminDoc.password = await hashPassword(newPassword);
    await adminDoc.save();

    return successResponse(null, 'Password changed successfully');
  } catch (error) {
    return handleError(error);
  }
}
