import { Types } from 'mongoose';
import { BlockedIp, Activity } from '@/models';
import { IBlockedIp, ActivityActorType } from '@/types';

export class IpBlockingService {
  /**
   * Check if IP is blocked
   */
  static async isBlocked(ipAddress: string): Promise<boolean> {
    const blocked = await BlockedIp.findOne({
      ipAddress,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    return !!blocked;
  }

  /**
   * Get all blocked IPs
   */
  static async getAllBlocked(
    options: { page?: number; limit?: number } = {}
  ): Promise<{ blockedIps: IBlockedIp[]; total: number }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [blockedIps, total] = await Promise.all([
      BlockedIp.find()
        .populate('blockedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BlockedIp.countDocuments(),
    ]);

    return { blockedIps, total };
  }

  /**
   * Block an IP address
   */
  static async blockIp(
    ipAddress: string,
    adminId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<IBlockedIp> {
    // Check if already blocked
    const existing = await BlockedIp.findOne({ ipAddress });
    if (existing) {
      throw new Error('IP address is already blocked');
    }

    const blockedIp = await BlockedIp.create({
      ipAddress,
      reason,
      blockedBy: new Types.ObjectId(adminId),
      expiresAt,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'block_ip',
      resource: 'blocked_ip',
      resourceId: blockedIp._id,
      details: { ipAddress, reason, expiresAt },
    });

    return blockedIp;
  }

  /**
   * Unblock an IP address
   */
  static async unblockIp(ipAddress: string, adminId: string): Promise<void> {
    const blockedIp = await BlockedIp.findOne({ ipAddress });
    if (!blockedIp) {
      throw new Error('IP address is not blocked');
    }

    await BlockedIp.findByIdAndDelete(blockedIp._id);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'unblock_ip',
      resource: 'blocked_ip',
      details: { ipAddress },
    });
  }

  /**
   * Unblock by ID
   */
  static async unblockById(blockedIpId: string, adminId: string): Promise<void> {
    const blockedIp = await BlockedIp.findById(blockedIpId);
    if (!blockedIp) {
      throw new Error('Blocked IP not found');
    }

    await BlockedIp.findByIdAndDelete(blockedIpId);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'unblock_ip',
      resource: 'blocked_ip',
      details: { ipAddress: blockedIp.ipAddress },
    });
  }

  /**
   * Clean up expired blocks
   */
  static async cleanupExpired(): Promise<number> {
    const result = await BlockedIp.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }
}

export default IpBlockingService;
