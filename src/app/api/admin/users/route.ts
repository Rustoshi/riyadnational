import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
import { createUserSchema, paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse, hashPassword, sanitizeUser } from '@/lib/utils';
import { ZodError } from 'zod';
import { UserStatus } from '@/types';
import { User } from '@/models';

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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as UserStatus | undefined;

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    console.log('[Get Users] Query:', query, 'Skip:', skip, 'Limit:', limit);
    
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    
    console.log('[Get Users] Found:', users.length, 'users, total:', total);

    return paginatedResponse(
      users.map(u => sanitizeUser(u)),
      createPaginationResponse(total, page, limit),
      'Users retrieved successfully'
    );
  } catch (error) {
    console.log('[Get Users] Error:', error);
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
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
    console.log('[Create User] Body:', body);
    
    // Map initialBalance to balance
    if (body.initialBalance !== undefined) {
      body.balance = parseFloat(body.initialBalance) || 0;
      delete body.initialBalance;
    }
    
    // Map initialBitcoinBalance to bitcoinBalance
    if (body.initialBitcoinBalance !== undefined) {
      body.bitcoinBalance = parseFloat(body.initialBitcoinBalance) || 0;
      delete body.initialBitcoinBalance;
    }
    
    // Extract sendNotificationEmail before validation
    const sendNotificationEmail = body.sendNotificationEmail || false;
    const originalPassword = body.password; // Store for email
    
    const validatedData = createUserSchema.parse(body);

    // Check if email exists
    const existing = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    // Generate random codes
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Prepare user data
    const userData: Record<string, unknown> = {
      ...validatedData,
      email: validatedData.email.toLowerCase(),
      password: await hashPassword(validatedData.password),
      // Auto-generate authorization codes
      cotCode: generateCode(),
      imfCode: generateCode(),
      taxCode: generateCode(),
    };
    
    // Hash PIN if provided
    if (validatedData.pin && validatedData.pin.trim() !== '') {
      userData.pin = await hashPassword(validatedData.pin);
    }
    
    // Handle createdAt for backdating
    if (validatedData.createdAt) {
      userData.createdAt = new Date(validatedData.createdAt);
    }
    
    // Remove sendNotificationEmail from userData as it's not a model field
    delete userData.sendNotificationEmail;

    // Create user
    const user = await User.create(userData);
    
    // Send notification email if requested
    if (sendNotificationEmail) {
      try {
        const { EmailService } = await import('@/services/emailService');
        await EmailService.sendWelcomeEmailWithCredentials(user, originalPassword);
        console.log('[Create User] Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('[Create User] Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return successResponse(
      sanitizeUser(user.toObject()),
      'User created successfully',
      201
    );
  } catch (error) {
    console.log('[Create User] Error:', error);
    if (error instanceof ZodError) {
      console.log('[Create User] Validation errors:', error.issues);
      return handleZodError(error);
    }
    return handleError(error);
  }
}
