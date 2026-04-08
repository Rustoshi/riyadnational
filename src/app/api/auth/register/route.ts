import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuthService } from '@/services/authService';
import { EmailService } from '@/services/emailService';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const result = await AuthService.register(validatedData);

    // Send registration received email (under review notification)
    try {
      await EmailService.sendRegistrationReceivedEmail({
        email: validatedData.email,
        name: validatedData.name,
      });
      console.log(`[Register] Sent registration received email to ${validatedData.email}`);
    } catch (emailError) {
      console.error('[Register] Failed to send registration email:', emailError);
      // Don't fail registration if email fails
    }

    return successResponse(result, 'Registration successful', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    if (error instanceof Error && error.message === 'Email already registered') {
      return errorResponse(error.message, 409);
    }
    return handleError(error);
  }
}

