import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

// POST /api/admin/irs-refunds/[id]/reject - Reject IRS refund
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
    
    // Get optional admin notes from body
    let adminNotes: string | undefined;
    try {
      const body = await request.json();
      adminNotes = body.adminNotes;
    } catch {
      // No body provided, that's fine
    }

    const refund = await IrsRefundService.rejectRefund(id, admin._id.toString(), adminNotes);

    return successResponse(refund, 'Refund request rejected successfully');
  } catch (error) {
    return handleError(error);
  }
}
