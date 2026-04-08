import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as object, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as any);
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a unique reference number
 */
export function generateReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().split('-')[0].toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Generate a unique account number
 */
export function generateAccountNumber(): string {
  const prefix = '10';
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${random}`;
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${namePart}${random}`;
}



/**
 * Generate a random card number (for demo purposes)
 */
export function generateCardNumber(type: 'visa' | 'mastercard'): string {
  const prefix = type === 'visa' ? '4' : '5';
  let number = prefix;
  for (let i = 0; i < 15; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

/**
 * Generate a random CVV
 */
export function generateCVV(): string {
  return Math.floor(Math.random() * 900 + 100).toString();
}

/**
 * Generate card expiry date (3 years from now)
 */
export function generateCardExpiry(): { month: string; year: string } {
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  return {
    month: (expiry.getMonth() + 1).toString().padStart(2, '0'),
    year: expiry.getFullYear().toString().slice(-2),
  };
}

/**
 * Mask a card number (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  return `****-****-****-${cardNumber.slice(-4)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(new Date(date));
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Calculate loan monthly payment
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

/**
 * Calculate investment return
 */
export function calculateInvestmentReturn(
  amount: number,
  returnPercentage: number
): number {
  return Math.round(amount * (1 + returnPercentage / 100) * 100) / 100;
}

/**
 * Sanitize user object for response (remove sensitive fields)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeUser(user: any): Record<string, unknown> {
  const sanitized = { ...user };
  const sensitiveFields = [
    'password',
    'twoFactorSecret',
    'pin',
    'taxCode',
    'imfCode',
    'cotCode',
  ];
  sensitiveFields.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
}

/**
 * Sanitize admin object for response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeAdmin(admin: any): Record<string, unknown> {
  const sanitized = { ...admin };
  const sensitiveFields = ['password', 'twoFactorSecret'];
  sensitiveFields.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Generate OTP
 */
export function generateOTP(length: number = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Parse pagination params
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number
): { page: number; limit: number; skip: number } {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 10), 10)));
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

/**
 * Create pagination response
 */
export function createPaginationResponse(
  total: number,
  page: number,
  limit: number
): { page: number; limit: number; total: number; totalPages: number } {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
