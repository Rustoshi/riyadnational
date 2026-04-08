import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, paginatedResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { IrsRefundStatus } from '@/models/IrsRefund';

// GET /api/admin/irs-refunds - List all IRS refunds
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
    const status = searchParams.get('status') as IrsRefundStatus | undefined;

    const { refunds, total } = await IrsRefundService.getAllRefunds({ page, limit, status });

    return paginatedResponse(
      refunds,
      createPaginationResponse(total, page, limit),
      'IRS refunds retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
