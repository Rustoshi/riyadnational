import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse, PaginatedResponse } from '@/types';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  message?: string
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination,
    },
    { status: 200 }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 422 }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });
  return validationErrorResponse(errors);
}

/**
 * Handle unknown errors
 */
export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);
  
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message;
    return errorResponse(message, 500);
  }
  
  return errorResponse('An unexpected error occurred', 500);
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Forbidden response
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

/**
 * Not found response
 */
export function notFoundResponse(
  message: string = 'Not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}
