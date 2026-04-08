import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { TransactionService } from '@/services/transactionService';
import { createDepositSchema, paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { uploadBase64ToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { ZodError } from 'zod';
import { DepositStatus } from '@/types';

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
    const status = searchParams.get('status') as DepositStatus | undefined;

    const { deposits, total } = await TransactionService.getUserDeposits(
      user._id.toString(),
      { page: params.page, limit: params.limit, status }
    );

    return paginatedResponse(
      deposits,
      createPaginationResponse(total, params.page, params.limit),
      'Deposits retrieved successfully'
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
    const validatedData = createDepositSchema.parse(body);

    // Upload proof image to Cloudinary if provided
    let proofImageUrl: string | undefined;
    if (validatedData.proofImage) {
      if (!isCloudinaryConfigured()) {
        throw new Error('Image upload service is not configured');
      }

      try {
        const uploadResult = await uploadBase64ToCloudinary(validatedData.proofImage, {
          folder: 'deposit-proofs',
        });
        proofImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Failed to upload proof image:', uploadError);
        throw new Error('Failed to upload proof image. Please try again.');
      }
    }

    const deposit = await TransactionService.createDeposit(
      user._id.toString(),
      validatedData.amount,
      validatedData.paymentMethod,
      proofImageUrl
    );

    return successResponse(deposit, 'Deposit request created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    return handleError(error);
  }
}
