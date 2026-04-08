import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IpBlockingService } from '@/services/ipBlockingService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { blockedIps, total } = await IpBlockingService.getAllBlocked({ page, limit });

    return paginatedResponse(
      blockedIps,
      createPaginationResponse(total, page, limit),
      'Blocked IPs retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { ipAddress, reason, expiresAt } = body;

    if (!ipAddress) {
      return errorResponse('IP address is required', 400);
    }

    const blockedIp = await IpBlockingService.blockIp(
      ipAddress,
      admin._id.toString(),
      reason,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return successResponse(blockedIp, 'IP address blocked successfully', 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already blocked')) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const blockedIpId = searchParams.get('id');
    const ipAddress = searchParams.get('ipAddress');

    if (blockedIpId) {
      await IpBlockingService.unblockById(blockedIpId, admin._id.toString());
      return successResponse(null, 'IP address unblocked successfully');
    }

    if (ipAddress) {
      await IpBlockingService.unblockIp(ipAddress, admin._id.toString());
      return successResponse(null, 'IP address unblocked successfully');
    }

    return errorResponse('ID or IP address is required', 400);
  } catch (error) {
    return handleError(error);
  }
}
