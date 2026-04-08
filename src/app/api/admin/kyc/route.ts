import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { KycService } from '@/services/kycService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { KycStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as KycStatus | undefined;

    const { kycs, total } = await KycService.getAllKyc({ page, limit, status });

    return paginatedResponse(
      kycs,
      createPaginationResponse(total, page, limit),
      'KYC applications retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { kycId, action, reason } = body;

    if (!kycId || !action) {
      return errorResponse('KYC ID and action are required', 400);
    }

    let kyc;
    if (action === 'approve') {
      kyc = await KycService.approveKyc(kycId, admin._id.toString());
    } else if (action === 'reject') {
      if (!reason) {
        return errorResponse('Rejection reason is required', 400);
      }
      kyc = await KycService.rejectKyc(kycId, admin._id.toString(), reason);
    } else {
      return errorResponse('Invalid action', 400);
    }

    return successResponse(kyc, `KYC ${action}d successfully`);
  } catch (error) {
    return handleError(error);
  }
}
