import { Types } from 'mongoose';
import { User, Transaction, Activity, Notification } from '@/models';
import { hashPassword, comparePassword, sanitizeUser } from '@/lib/utils';
import {
  IUser,
  UserStatus,
  KycStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';
import { UpdateProfileInput, UpdateUserInput, TopupUserInput } from '@/lib/validations';

export class UserService {
  /**
   * Get user by ID
   */
  static async getById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Get user by account number
   */
  static async getByAccountNumber(accountNumber: string): Promise<IUser | null> {
    return User.findOne({ accountNumber });
  }

  /**
   * Get user by referral code
   */
  static async getByReferralCode(referralCode: string): Promise<IUser | null> {
    return User.findOne({ referralCode: referralCode.toUpperCase() });
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.country) user.country = data.country;
    if (data.address) user.address = data.address;
    if (data.city) user.city = data.city;
    if (data.zipCode) user.zipCode = data.zipCode;
    if (data.dateOfBirth) user.dateOfBirth = new Date(data.dateOfBirth);

    await user.save();

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'update_profile',
      resource: 'user',
      resourceId: user._id,
    });

    return user;
  }

  /**
   * Update user profile photo
   */
  static async updateProfilePhoto(userId: string, photoUrl: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.profilePhoto = photoUrl;
    await user.save();

    return user;
  }

  /**
   * Change user PIN
   */
  static async changePin(userId: string, currentPin: string | undefined, newPin: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user has existing PIN, verify it
    if (user.pin) {
      if (!currentPin) {
        throw new Error('Current PIN is required');
      }

      let isValid = false;
      // Check if current PIN matches (support both hash and plain text)
      if (user.pin.length === 60 && user.pin.startsWith('$2a$')) {
        isValid = await comparePassword(currentPin, user.pin);
      } else {
        isValid = currentPin === user.pin;
      }

      if (!isValid) {
        throw new Error('Current PIN is incorrect');
      }
    }

    // Save new PIN as plain text (requested feature)
    user.pin = newPin;
    await user.save();

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'change_pin',
      resource: 'user',
      resourceId: user._id,
    });
  }

  /**
   * Verify user PIN
   */
  static async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user || !user.pin) {
      return false;
    }
    if (!user || !user.pin) {
      return false;
    }

    // Support both plain text and hashed PINs for backward compatibility
    // If PIN length is 60 chars (bcrypt hash length), use comparePassword
    if (user.pin.length === 60 && user.pin.startsWith('$2a$')) {
      return comparePassword(pin, user.pin);
    }

    // Otherwise use direct string comparison
    return pin === user.pin;
  }

  /**
   * Update user settings
   */
  static async updateSettings(
    userId: string,
    settings: { emailNotifications?: boolean; smsNotifications?: boolean; theme?: 'light' | 'dark' }
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (settings.emailNotifications !== undefined) {
      user.emailNotifications = settings.emailNotifications;
    }
    if (settings.smsNotifications !== undefined) {
      user.smsNotifications = settings.smsNotifications;
    }
    if (settings.theme) {
      user.theme = settings.theme;
    }

    await user.save();
    return user;
  }

  /**
   * Get user dashboard data
   */
  static async getDashboardData(userId: string): Promise<{
    user: Record<string, unknown>;
    recentTransactions: unknown[];
    stats: {
      totalDeposits: number;
      totalWithdrawals: number;
      totalTransfers: number;
    };
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get recent transactions (most recent first)
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get stats
    const stats = await Transaction.aggregate([
      { $match: { user: new Types.ObjectId(userId), status: TransactionStatus.COMPLETED } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const statsMap: Record<string, number> = {};
    stats.forEach((s) => {
      statsMap[s._id] = s.total;
    });

    return {
      user: sanitizeUser(user.toObject()),
      recentTransactions,
      stats: {
        totalDeposits: statsMap[TransactionType.DEPOSIT] || 0,
        totalWithdrawals: statsMap[TransactionType.WITHDRAWAL] || 0,
        totalTransfers: (statsMap[TransactionType.TRANSFER_OUT] || 0),
      },
    };
  }

  /**
   * Get all users (admin)
   */
  static async getAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ users: IUser[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  /**
   * Admin update user
   */
  static async adminUpdateUser(userId: string, data: UpdateUserInput, adminId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof UpdateUserInput];
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (user as any)[key] = value;
      }
    });

    await user.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_user',
      resource: 'user',
      resourceId: user._id,
      details: data,
    });

    return user;
  }

  /**
   * Admin topup user balance
   */
  static async topupBalance(
    userId: string,
    data: TopupUserInput,
    adminId: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user[data.type === 'balance' ? 'balance' : data.type === 'bonus' ? 'bonus' : 'tradingBalance'];

    // Update balance
    if (data.type === 'balance') {
      user.balance += data.amount;
    } else if (data.type === 'bonus') {
      user.bonus += data.amount;
    } else {
      user.tradingBalance += data.amount;
    }

    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: data.type === 'bonus' ? TransactionType.BONUS : TransactionType.DEPOSIT,
      amount: data.amount,
      balanceBefore,
      balanceAfter: user[data.type === 'balance' ? 'balance' : data.type === 'bonus' ? 'bonus' : 'tradingBalance'],
      status: TransactionStatus.COMPLETED,
      description: data.description || `Admin topup (${data.type})`,
      metadata: { adminId, type: data.type },
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Account Credited',
      message: `Your ${data.type} has been credited with $${data.amount.toFixed(2)}`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'topup_user',
      resource: 'user',
      resourceId: user._id,
      details: data,
    });

    return user;
  }

  /**
   * Admin deduct user balance
   */
  static async deductBalance(
    userId: string,
    data: TopupUserInput,
    adminId: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = user[data.type === 'balance' ? 'balance' : data.type === 'bonus' ? 'bonus' : 'tradingBalance'];

    if (currentBalance < data.amount) {
      throw new Error('Insufficient balance');
    }

    const balanceBefore = currentBalance;

    // Update balance
    if (data.type === 'balance') {
      user.balance -= data.amount;
    } else if (data.type === 'bonus') {
      user.bonus -= data.amount;
    } else {
      user.tradingBalance -= data.amount;
    }

    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: TransactionType.FEE,
      amount: data.amount,
      balanceBefore,
      balanceAfter: user[data.type === 'balance' ? 'balance' : data.type === 'bonus' ? 'bonus' : 'tradingBalance'],
      status: TransactionStatus.COMPLETED,
      description: data.description || `Admin deduction (${data.type})`,
      metadata: { adminId, type: data.type },
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Account Debited',
      message: `$${data.amount.toFixed(2)} has been deducted from your ${data.type}`,
      type: NotificationType.WARNING,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'deduct_user',
      resource: 'user',
      resourceId: user._id,
      details: data,
    });

    return user;
  }

  /**
   * Block user
   */
  static async blockUser(userId: string, adminId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = UserStatus.BLOCKED;
    await user.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'block_user',
      resource: 'user',
      resourceId: user._id,
    });

    return user;
  }

  /**
   * Unblock user
   */
  static async unblockUser(userId: string, adminId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = UserStatus.ACTIVE;
    await user.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'unblock_user',
      resource: 'user',
      resourceId: user._id,
    });

    return user;
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string, adminId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await User.findByIdAndDelete(userId);

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_user',
      resource: 'user',
      details: { email: user.email, name: user.name },
    });
  }

  /**
   * Update user authorization codes
   */
  static async updateAuthCodes(
    userId: string,
    codes: { taxCode?: string; imfCode?: string; cotCode?: string },
    adminId: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (codes.taxCode !== undefined) user.taxCode = codes.taxCode;
    if (codes.imfCode !== undefined) user.imfCode = codes.imfCode;
    if (codes.cotCode !== undefined) user.cotCode = codes.cotCode;

    await user.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_auth_codes',
      resource: 'user',
      resourceId: user._id,
    });

    return user;
  }

  /**
   * Update user limits
   */
  static async updateLimits(
    userId: string,
    limits: { dailyTransferLimit?: number; dailyWithdrawalLimit?: number },
    adminId: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (limits.dailyTransferLimit !== undefined) {
      user.dailyTransferLimit = limits.dailyTransferLimit;
    }
    if (limits.dailyWithdrawalLimit !== undefined) {
      user.dailyWithdrawalLimit = limits.dailyWithdrawalLimit;
    }

    await user.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_limits',
      resource: 'user',
      resourceId: user._id,
      details: limits,
    });

    return user;
  }
}

export default UserService;
