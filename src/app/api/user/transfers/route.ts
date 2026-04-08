import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { TransactionService } from '@/services/transactionService';
import { UserService } from '@/services/userService';
import { internalTransferSchema, localTransferSchema, internationalTransferSchema, paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { TransferType, TransferStatus } from '@/types';

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
    const type = searchParams.get('type') as TransferType | undefined;
    const status = searchParams.get('status') as TransferStatus | undefined;

    const { transfers, total } = await TransactionService.getUserTransfers(
      user._id.toString(),
      { page: params.page, limit: params.limit, type, status }
    );

    return paginatedResponse(
      transfers,
      createPaginationResponse(total, params.page, params.limit),
      'Transfers retrieved successfully'
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
    const { type } = body;

    let transfer;

    if (type === 'internal') {
      const validatedData = internalTransferSchema.parse(body);
      
      // Verify PIN
      const isPinValid = await UserService.verifyPin(user._id.toString(), validatedData.pin);
      if (!isPinValid) {
        return errorResponse('Invalid PIN', 401);
      }

      transfer = await TransactionService.createInternalTransfer(
        user._id.toString(),
        validatedData.recipientAccountNumber,
        validatedData.amount,
        validatedData.description
      );
    } else if (type === 'local') {
      const validatedData = localTransferSchema.parse(body);
      
      // Verify PIN
      const isPinValid = await UserService.verifyPin(user._id.toString(), validatedData.pin);
      if (!isPinValid) {
        return errorResponse('Invalid PIN', 401);
      }

      transfer = await TransactionService.createExternalTransfer(
        user._id.toString(),
        TransferType.LOCAL,
        {
          accountNumber: validatedData.accountNumber,
          accountName: validatedData.accountName,
          bankName: validatedData.bankName,
          bankCode: validatedData.bankCode,
        },
        validatedData.amount,
        validatedData.description
      );
    } else if (type === 'international') {
      const validatedData = internationalTransferSchema.parse(body);
      
      // Verify PIN
      const isPinValid = await UserService.verifyPin(user._id.toString(), validatedData.pin);
      if (!isPinValid) {
        return errorResponse('Invalid PIN', 401);
      }

      transfer = await TransactionService.createExternalTransfer(
        user._id.toString(),
        TransferType.INTERNATIONAL,
        {
          accountNumber: validatedData.accountNumber,
          accountName: validatedData.accountName,
          bankName: validatedData.bankName,
          country: validatedData.country,
          swiftCode: validatedData.swiftCode,
          routingNumber: validatedData.routingNumber,
        },
        validatedData.amount,
        validatedData.description
      );
    } else {
      return errorResponse('Invalid transfer type. Must be internal, local, or international', 400);
    }

    return successResponse(transfer, 'Transfer initiated successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || 
          error.message.includes('not found') ||
          error.message.includes('Cannot transfer')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
