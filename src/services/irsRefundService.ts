import { Types } from 'mongoose';
import { IrsRefund, User, Activity, Notification } from '@/models';
import { IIrsRefund, IrsRefundStatus } from '@/models/IrsRefund';
import {
  ActivityActorType,
  NotificationType,
} from '@/types';

export class IrsRefundService {
  /**
   * Get user's IRS refunds
   */
  static async getUserRefunds(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ refunds: IIrsRefund[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      IrsRefund.find({ user: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      IrsRefund.countDocuments({ user: new Types.ObjectId(userId) }),
    ]);

    return { refunds, total };
  }

  /**
   * Submit IRS refund request (matching PHP logic)
   */
  static async submitRefund(
    userId: string,
    data: {
      name: string;
      ssn: string;
      idmeEmail: string;
      idmePassword: string;
      country: string;
    }
  ): Promise<IIrsRefund> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a pending or approved refund
    const existingRefund = await IrsRefund.findOne({
      user: new Types.ObjectId(userId),
      status: { $in: [IrsRefundStatus.PENDING, IrsRefundStatus.APPROVED] },
    });

    if (existingRefund) {
      throw new Error('You already have a pending or approved refund request.');
    }

    const refund = await IrsRefund.create({
      user: user._id,
      name: data.name,
      ssn: data.ssn,
      idmeEmail: data.idmeEmail,
      idmePassword: data.idmePassword,
      country: data.country,
      status: IrsRefundStatus.PENDING,
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'IRS Refund Request Submitted',
      message: 'Your IRS refund request has been submitted and is pending review.',
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'submit_irs_refund',
      resource: 'irs_refund',
      resourceId: refund._id,
      details: { name: data.name },
    });

    return refund;
  }

  /**
   * Update filing ID
   */
  static async updateFilingId(
    userId: string,
    filingId: string
  ): Promise<IIrsRefund> {
    const refund = await IrsRefund.findOne({ user: new Types.ObjectId(userId) });
    
    if (!refund) {
      throw new Error('No refund request found.');
    }

    if (refund.filingId) {
      throw new Error('You have already submitted a filing ID.');
    }

    if (refund.status !== IrsRefundStatus.PENDING) {
      throw new Error('This refund request is no longer pending.');
    }

    refund.filingId = filingId;
    await refund.save();

    return refund;
  }

  /**
   * Admin: Get all refunds
   */
  static async getAllRefunds(
    options: { status?: IrsRefundStatus; page?: number; limit?: number } = {}
  ): Promise<{ refunds: IIrsRefund[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      IrsRefund.find(query)
        .populate('user', 'name email accountNumber profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      IrsRefund.countDocuments(query),
    ]);

    return { refunds, total };
  }

  /**
   * Admin: Get single refund by ID
   */
  static async getRefundById(refundId: string): Promise<IIrsRefund | null> {
    return IrsRefund.findById(refundId)
      .populate('user', 'name email accountNumber profilePhoto irsFilingId');
  }

  /**
   * Admin: Approve refund
   */
  static async approveRefund(
    refundId: string,
    adminId: string
  ): Promise<IIrsRefund> {
    const refund = await IrsRefund.findById(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    refund.status = IrsRefundStatus.APPROVED;
    refund.processedBy = new Types.ObjectId(adminId);
    refund.processedAt = new Date();
    await refund.save();

    // Notify user
    await Notification.create({
      user: refund.user,
      title: 'IRS Refund Approved',
      message: 'Your IRS refund request has been approved.',
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'approve_irs_refund',
      resource: 'irs_refund',
      resourceId: refund._id,
      details: { status: IrsRefundStatus.APPROVED },
    });

    return refund;
  }

  /**
   * Admin: Reject refund
   */
  static async rejectRefund(
    refundId: string,
    adminId: string,
    adminNotes?: string
  ): Promise<IIrsRefund> {
    const refund = await IrsRefund.findById(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    refund.status = IrsRefundStatus.REJECTED;
    refund.processedBy = new Types.ObjectId(adminId);
    refund.processedAt = new Date();
    if (adminNotes) {
      refund.adminNotes = adminNotes;
    }
    await refund.save();

    // Notify user
    await Notification.create({
      user: refund.user,
      title: 'IRS Refund Rejected',
      message: `Your IRS refund request has been rejected. ${adminNotes || ''}`,
      type: NotificationType.ERROR,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'reject_irs_refund',
      resource: 'irs_refund',
      resourceId: refund._id,
      details: { status: IrsRefundStatus.REJECTED, adminNotes },
    });

    return refund;
  }

  /**
   * Admin: Process refund (mark as processed/paid)
   */
  static async processRefund(
    refundId: string,
    adminId: string
  ): Promise<IIrsRefund> {
    const refund = await IrsRefund.findById(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status !== IrsRefundStatus.APPROVED) {
      throw new Error('Refund must be approved before processing');
    }

    refund.status = IrsRefundStatus.PROCESSED;
    refund.processedBy = new Types.ObjectId(adminId);
    refund.processedAt = new Date();
    await refund.save();

    // Credit user balance if amount is set
    if (refund.amount && refund.amount > 0) {
      const user = await User.findById(refund.user);
      if (user) {
        user.balance += refund.amount;
        await user.save();
      }
    }

    // Notify user
    await Notification.create({
      user: refund.user,
      title: 'IRS Refund Processed',
      message: 'Your IRS refund has been processed successfully.',
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'process_irs_refund',
      resource: 'irs_refund',
      resourceId: refund._id,
      details: { status: IrsRefundStatus.PROCESSED },
    });

    return refund;
  }

  /**
   * Admin: Delete refund
   */
  static async deleteRefund(refundId: string): Promise<void> {
    const refund = await IrsRefund.findById(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }
    await refund.deleteOne();
  }
}

export default IrsRefundService;
