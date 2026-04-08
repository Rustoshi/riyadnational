import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { PaymentMethodStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Build query for active payment methods
    const query: Record<string, unknown> = { status: PaymentMethodStatus.ACTIVE };
    if (type) {
      query.type = type;
    }

    const paymentMethods = await PaymentMethod.find(query).sort({ name: 1 }).lean();

    return successResponse(paymentMethods, 'Payment methods retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}
