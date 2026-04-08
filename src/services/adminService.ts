import { Types } from 'mongoose';
import { Admin, Activity, User, Transaction, Deposit, Withdrawal, Transfer } from '@/models';
import { hashPassword, sanitizeAdmin } from '@/lib/utils';
import {
  IAdmin,
  AdminRole,
  AdminStatus,
  ActivityActorType,
  TransactionStatus,
  DepositStatus,
  WithdrawalStatus,
  TransferStatus,
} from '@/types';
import { CreateAdminInput, UpdateAdminInput } from '@/lib/validations';

export class AdminService {
  /**
   * Get admin by ID
   */
  static async getById(adminId: string): Promise<IAdmin | null> {
    return Admin.findById(adminId);
  }

  /**
   * Get admin by email
   */
  static async getByEmail(email: string): Promise<IAdmin | null> {
    return Admin.findOne({ email: email.toLowerCase() });
  }

  /**
   * Create admin
   */
  static async createAdmin(data: CreateAdminInput, creatorId: string): Promise<IAdmin> {
    // Check if email already exists
    const existing = await Admin.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const admin = await Admin.create({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: data.role || AdminRole.ADMIN,
      permissions: data.permissions || [],
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(creatorId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_admin',
      resource: 'admin',
      resourceId: admin._id,
      details: { email: admin.email, role: admin.role },
    });

    return admin;
  }

  /**
   * Update admin
   */
  static async updateAdmin(
    adminId: string,
    data: UpdateAdminInput,
    updaterId: string
  ): Promise<IAdmin> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Update fields
    if (data.email) admin.email = data.email.toLowerCase();
    if (data.name) admin.name = data.name;
    if (data.role) admin.role = data.role;
    if (data.permissions) admin.permissions = data.permissions;
    if (data.status) admin.status = data.status;

    await admin.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(updaterId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_admin',
      resource: 'admin',
      resourceId: admin._id,
      details: data,
    });

    return admin;
  }

  /**
   * Delete admin
   */
  static async deleteAdmin(adminId: string, deleterId: string): Promise<void> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent deleting super admin
    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new Error('Cannot delete super admin');
    }

    await Admin.findByIdAndDelete(adminId);

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(deleterId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_admin',
      resource: 'admin',
      details: { email: admin.email, name: admin.name },
    });
  }

  /**
   * Block admin
   */
  static async blockAdmin(adminId: string, blockerId: string): Promise<IAdmin> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new Error('Cannot block super admin');
    }

    admin.status = AdminStatus.BLOCKED;
    await admin.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(blockerId),
      actorType: ActivityActorType.ADMIN,
      action: 'block_admin',
      resource: 'admin',
      resourceId: admin._id,
    });

    return admin;
  }

  /**
   * Unblock admin
   */
  static async unblockAdmin(adminId: string, unblockerId: string): Promise<IAdmin> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    admin.status = AdminStatus.ACTIVE;
    await admin.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(unblockerId),
      actorType: ActivityActorType.ADMIN,
      action: 'unblock_admin',
      resource: 'admin',
      resourceId: admin._id,
    });

    return admin;
  }

  /**
   * Get all admins
   */
  static async getAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: AdminRole;
    status?: AdminStatus;
  } = {}): Promise<{ admins: IAdmin[]; total: number }> {
    const { page = 1, limit = 10, search, role, status } = options;
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      Admin.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Admin.countDocuments(query),
    ]);

    return { admins, total };
  }

  /**
   * Get dashboard stats
   */
  static async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    pendingTransfers: number;
    pendingKyc: number;
    todayTransactions: number;
    todayVolume: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      balanceAgg,
      depositsAgg,
      withdrawalsAgg,
      pendingDeposits,
      pendingWithdrawals,
      pendingTransfers,
      pendingKyc,
      todayStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      // Total deposits from Transaction model
      Transaction.aggregate([
        {
          $match: {
            type: 'deposit',
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Total withdrawals from Transaction model
      Transaction.aggregate([
        {
          $match: {
            type: 'withdrawal',
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Deposit.countDocuments({ status: DepositStatus.PENDING }),
      Withdrawal.countDocuments({ status: WithdrawalStatus.PENDING }),
      Transfer.countDocuments({ status: TransferStatus.PENDING }),
      User.countDocuments({ kycStatus: 'pending' }),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalBalance: balanceAgg[0]?.total || 0,
      totalDeposits: depositsAgg[0]?.total || 0,
      totalWithdrawals: withdrawalsAgg[0]?.total || 0,
      pendingDeposits,
      pendingWithdrawals,
      pendingTransfers,
      pendingKyc,
      todayTransactions: todayStats[0]?.count || 0,
      todayVolume: todayStats[0]?.volume || 0,
    };
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 20): Promise<unknown[]> {
    // Skip populate for now due to refPath model name mismatch
    // The actorType stores 'user'/'admin' but models are 'User'/'Admin'
    return Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Reset admin password
   */
  static async resetPassword(
    adminId: string,
    newPassword: string,
    resetById: string
  ): Promise<void> {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    admin.password = await hashPassword(newPassword);
    await admin.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(resetById),
      actorType: ActivityActorType.ADMIN,
      action: 'reset_admin_password',
      resource: 'admin',
      resourceId: admin._id,
    });
  }
}

export default AdminService;
