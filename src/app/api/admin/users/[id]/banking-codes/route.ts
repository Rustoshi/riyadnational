import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';

// PUT /api/admin/users/[id]/banking-codes - Update user banking authorization codes
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

    const { cotCode, taxCode, imfCode } = body;

    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Update banking authorization codes
    if (cotCode !== undefined) {
      user.cotCode = cotCode;
    }
    if (taxCode !== undefined) {
      user.taxCode = taxCode;
    }
    if (imfCode !== undefined) {
      user.imfCode = imfCode;
    }
    
    await user.save();

    return successResponse(
      { 
        cotCode: user.cotCode,
        taxCode: user.taxCode,
        imfCode: user.imfCode
      },
      'User banking authorization codes updated successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
