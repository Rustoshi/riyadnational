import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CardService } from '@/services/cardService';
import { successResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { ZodError } from 'zod';
import { CardType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const cards = await CardService.getUserCards(user._id.toString());

    return successResponse(cards, 'Cards retrieved successfully');
  } catch (error) {
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
    const { cardType, cardholderName, billingAddress } = body;

    if (!cardType || !cardholderName || !billingAddress) {
      return errorResponse('Card type, cardholder name, and billing address are required', 400);
    }

    const card = await CardService.applyCard(
      user._id.toString(),
      cardType as CardType,
      cardholderName,
      billingAddress
    );

    return successResponse(card, 'Card application submitted successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    return handleError(error);
  }
}
