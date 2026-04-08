import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { connectDB } from '@/lib/db';
import { User, Admin } from '@/models';
import { IUser, IAdmin, UserStatus, AdminStatus, JwtPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
  admin?: IAdmin;
  authPayload?: JwtPayload;
}

/**
 * Extract token from request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Verify and get user from token
 */
export async function getUserFromToken(token: string): Promise<IUser | null> {
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'user') {
    return null;
  }

  await connectDB();
  const user = await User.findById(payload.id);
  
  // Block suspended and blocked users from accessing the API
  // Allow active, inactive, and dormant users to access their account
  if (!user || user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
    return null;
  }

  return user;
}

/**
 * Verify and get admin from token
 */
export async function getAdminFromToken(token: string): Promise<IAdmin | null> {
  const payload = verifyToken(token);
  console.log('[Auth] Token payload:', payload);
  if (!payload || payload.type !== 'admin') {
    console.log('[Auth] Invalid payload or not admin type');
    return null;
  }

  await connectDB();
  const admin = await Admin.findById(payload.id);
  console.log('[Auth] Admin from DB:', admin ? { id: admin._id, status: admin.status } : null);
  
  if (!admin || admin.status !== AdminStatus.ACTIVE) {
    console.log('[Auth] Admin not found or not active. Status:', admin?.status, 'Expected:', AdminStatus.ACTIVE);
    return null;
  }

  return admin;
}

/**
 * Authenticate user request
 */
export async function authenticateUser(
  request: NextRequest
): Promise<{ user: IUser | null; error: string | null }> {
  const token = extractToken(request);
  if (!token) {
    return { user: null, error: 'No token provided' };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}

/**
 * Authenticate admin request
 */
export async function authenticateAdmin(
  request: NextRequest
): Promise<{ admin: IAdmin | null; error: string | null }> {
  const token = extractToken(request);
  if (!token) {
    return { admin: null, error: 'No token provided' };
  }

  const admin = await getAdminFromToken(token);
  if (!admin) {
    return { admin: null, error: 'Invalid or expired token' };
  }

  return { admin, error: null };
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
