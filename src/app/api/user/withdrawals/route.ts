import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { TransactionService } from '@/services/transactionService';
import { UserService } from '@/services/userService';
import { createWithdrawalSchema, paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { WithdrawalStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    const status = searchParams.get('status') as WithdrawalStatus | undefined;

    const { withdrawals, total } = await TransactionService.getUserWithdrawals(
      user._id.toString(),
      { page: params.page, limit: params.limit, status }
    );

    return paginatedResponse(
      withdrawals,
      createPaginationResponse(total, params.page, params.limit),
      'Withdrawals retrieved successfully'
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const validatedData = createWithdrawalSchema.parse(body);

    // Verify PIN
    const isPinValid = await UserService.verifyPin(user._id.toString(), validatedData.pin);
    if (!isPinValid) {
      return errorResponse('Invalid PIN', 401);
    }

    const withdrawal = await TransactionService.createWithdrawal(
      user._id.toString(),
      validatedData.amount,
      validatedData.paymentMethod,
      validatedData.paymentDetails
    );

    return successResponse(withdrawal, 'Withdrawal request created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    if (error instanceof Error) {
      // Handle business logic errors with appropriate status codes
      const businessErrors = [
        'dormant',
        'suspended',
        'blocked',
        'inactive',
        'Insufficient',
        'verification',
        'KYC',
        'payment method',
        'amount must be',
      ];
      
      if (businessErrors.some(keyword => error.message.toLowerCase().includes(keyword.toLowerCase()))) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
