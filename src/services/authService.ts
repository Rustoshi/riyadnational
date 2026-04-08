import { Types } from 'mongoose';
import { User, Admin, Activity } from '@/models';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  sanitizeUser,
  sanitizeAdmin,
  generateOTP,
} from '@/lib/utils';
import {
  IUser,
  IAdmin,
  UserStatus,
  AdminStatus,
  KycStatus,
  ActivityActorType,
  JwtPayload,
  LoginResponse,
} from '@/types';
import { RegisterInput, LoginInput } from '@/lib/validations';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterInput): Promise<{ user: Partial<IUser> }> {
    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }



    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // PIN is stored as plain text (requested feature)
    const pin = data.pin;

    // Check for referral
    let referredBy: Types.ObjectId | undefined;
    if (data.referralCode) {
      const referrer = await User.findOne({ referralCode: data.referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Combine first name, middle name, and last name into full name
    const fullName = [data.name, data.middleName, data.lastName].filter(Boolean).join(' ');

    // Create user
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: fullName,
      // username removed
      phone: data.phone,
      country: data.country,
      currency: data.currency || 'USD',
      accountType: data.accountType,
      pin: pin,
      status: UserStatus.PENDING,
      cotCode: generateOTP(6), // Auto-generate 6-digit COT code
      imfCode: generateOTP(6), // Auto-generate 6-digit IMF code
      referredBy,
    });

    return {
      user: sanitizeUser(user.toObject()),
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    // Find user
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check status - block suspended and blocked accounts from login
    // Dormant, inactive, and active accounts can still login
    if (user.status === UserStatus.SUSPENDED) {
      throw new Error(
        'Your account has been suspended. Please contact our support team for assistance.'
      );
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new Error(
        'Your account has been blocked. Please contact our support team for assistance.'
      );
    }
    if (user.status === UserStatus.PENDING) {
      throw new Error(
        'Your account is pending review. You will be notified once approved.'
      );
    }

    // Update last login
    user.lastLogin = new Date();
    if (ipAddress) {
      user.loginIp = ipAddress;
    }
    await user.save();

    // Generate tokens
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      type: 'user',
    };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'login',
      resource: 'user',
      resourceId: user._id,
      ipAddress,
    });

    return {
      user: sanitizeUser(user.toObject()),
      token,
      refreshToken,
    };
  }

  /**
   * Admin login
   */
  static async adminLogin(data: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    // Find admin
    console.log('[AuthService] Looking for admin with email:', data.email.toLowerCase());
    const admin = await Admin.findOne({ email: data.email.toLowerCase() });
    console.log('[AuthService] Admin found:', admin ? 'yes' : 'no');
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    // Check password
    console.log('[AuthService] Checking password...');
    const isValidPassword = await comparePassword(data.password, admin.password);
    console.log('[AuthService] Password valid:', isValidPassword);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check status
    if (admin.status === AdminStatus.BLOCKED) {
      throw new Error('Your account has been blocked.');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const payload: JwtPayload = {
      id: admin._id.toString(),
      email: admin.email,
      type: 'admin',
    };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log activity
    await Activity.create({
      actor: admin._id,
      actorType: ActivityActorType.ADMIN,
      action: 'login',
      resource: 'admin',
      resourceId: admin._id,
      ipAddress,
    });

    return {
      user: sanitizeAdmin(admin.toObject()),
      token,
      refreshToken,
    };
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshTokenStr: string): Promise<{ token: string; refreshToken: string }> {
    const decoded = verifyRefreshToken(refreshTokenStr);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Verify user/admin still exists and is active
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('User not found or inactive');
      }
    } else {
      const admin = await Admin.findById(decoded.id);
      if (!admin || admin.status !== AdminStatus.ACTIVE) {
        throw new Error('Admin not found or inactive');
      }
    }

    // Generate new tokens
    const payload: JwtPayload = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
    };
    const token = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Verify token and get user/admin
   */
  static async verifyAndGetUser(token: string): Promise<IUser | IAdmin | null> {
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user || user.status !== UserStatus.ACTIVE) {
        return null;
      }
      return user;
    } else {
      const admin = await Admin.findById(decoded.id);
      if (!admin || admin.status !== AdminStatus.ACTIVE) {
        return null;
      }
      return admin;
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    await user.save();

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'change_password',
      resource: 'user',
      resourceId: user._id,
    });
  }

  /**
   * Change admin password
   */
  static async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, admin.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and save new password
    admin.password = await hashPassword(newPassword);
    await admin.save();

    // Log activity
    await Activity.create({
      actor: admin._id,
      actorType: ActivityActorType.ADMIN,
      action: 'change_password',
      resource: 'admin',
      resourceId: admin._id,
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get admin by ID
   */
  static async getAdminById(adminId: string): Promise<IAdmin | null> {
    return Admin.findById(adminId);
  }
}

export default AuthService;
