import { Types } from 'mongoose';
import { Kyc, User, Activity, Notification } from '@/models';
import {
  IKyc,
  KycStatus,
  DocumentType,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class KycService {
  /**
   * Get user KYC
   */
  static async getUserKyc(userId: string): Promise<IKyc | null> {
    return Kyc.findOne({ user: new Types.ObjectId(userId) });
  }

  /**
   * Submit KYC
   */
  static async submitKyc(
    userId: string,
    data: {
      documentType: DocumentType;
      documentNumber: string;
      frontImage: string;
      backImage?: string;
      selfieImage: string;
    }
  ): Promise<IKyc> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if KYC already exists
    const existingKyc = await Kyc.findOne({ user: userId });
    if (existingKyc) {
      if (existingKyc.status === KycStatus.APPROVED) {
        throw new Error('KYC already approved');
      }
      if (existingKyc.status === KycStatus.PENDING) {
        throw new Error('KYC already pending review');
      }
      // Update existing rejected KYC
      existingKyc.documentType = data.documentType;
      existingKyc.documentNumber = data.documentNumber;
      existingKyc.frontImage = data.frontImage;
      existingKyc.backImage = data.backImage;
      existingKyc.selfieImage = data.selfieImage;
      existingKyc.status = KycStatus.PENDING;
      existingKyc.rejectionReason = undefined;
      await existingKyc.save();

      // Update user KYC status
      user.kycStatus = KycStatus.PENDING;
      await user.save();

      return existingKyc;
    }

    // Create new KYC
    const kyc = await Kyc.create({
      user: user._id,
      ...data,
      status: KycStatus.PENDING,
    });

    // Update user KYC status
    user.kycStatus = KycStatus.PENDING;
    await user.save();

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'KYC Submitted',
      message: 'Your KYC documents have been submitted and are pending review.',
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'submit_kyc',
      resource: 'kyc',
      resourceId: kyc._id,
      details: { documentType: data.documentType },
    });

    // Send KYC submission email (non-blocking)
    import('@/services/emailService').then(({ EmailService }) => {
      EmailService.sendKycSubmissionEmail(user, data.documentType).catch((err) => {
        console.error('[EMAIL] Failed to send KYC submission email:', err);
      });
    });

    return kyc;
  }

  /**
   * Admin: Get all KYC applications
   */
  static async getAllKyc(
    options: { status?: KycStatus; page?: number; limit?: number } = {}
  ): Promise<{ kycs: IKyc[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [kycs, total] = await Promise.all([
      Kyc.find(query)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Kyc.countDocuments(query),
    ]);

    return { kycs, total };
  }

  /**
   * Admin: Approve KYC
   */
  static async approveKyc(kycId: string, adminId: string): Promise<IKyc> {
    const kyc = await Kyc.findById(kycId);
    if (!kyc) {
      throw new Error('KYC not found');
    }

    if (kyc.status !== KycStatus.PENDING) {
      throw new Error('KYC is not pending');
    }

    kyc.status = KycStatus.APPROVED;
    kyc.reviewedBy = new Types.ObjectId(adminId);
    kyc.reviewedAt = new Date();
    await kyc.save();

    // Update user KYC status
    await User.findByIdAndUpdate(kyc.user, { kycStatus: KycStatus.APPROVED });

    // Notify user
    await Notification.create({
      user: kyc.user,
      title: 'KYC Approved',
      message: 'Your KYC verification has been approved. You can now access all features.',
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'approve_kyc',
      resource: 'kyc',
      resourceId: kyc._id,
    });

    // Send KYC approval email (non-blocking)
    User.findById(kyc.user).then((user) => {
      if (user) {
        import('@/services/emailService').then(({ EmailService }) => {
          EmailService.sendKycApprovalEmail(user).catch((err) => {
            console.error('[EMAIL] Failed to send KYC approval email:', err);
          });
        });
      }
    });

    return kyc;
  }

  /**
   * Admin: Reject KYC
   */
  static async rejectKyc(
    kycId: string,
    adminId: string,
    reason: string
  ): Promise<IKyc> {
    const kyc = await Kyc.findById(kycId);
    if (!kyc) {
      throw new Error('KYC not found');
    }

    if (kyc.status !== KycStatus.PENDING) {
      throw new Error('KYC is not pending');
    }

    kyc.status = KycStatus.REJECTED;
    kyc.rejectionReason = reason;
    kyc.reviewedBy = new Types.ObjectId(adminId);
    kyc.reviewedAt = new Date();
    await kyc.save();

    // Update user KYC status
    await User.findByIdAndUpdate(kyc.user, { kycStatus: KycStatus.REJECTED });

    // Notify user
    await Notification.create({
      user: kyc.user,
      title: 'KYC Rejected',
      message: `Your KYC verification has been rejected. Reason: ${reason}`,
      type: NotificationType.ERROR,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'reject_kyc',
      resource: 'kyc',
      resourceId: kyc._id,
      details: { reason },
    });

    // Send KYC rejection email (non-blocking)
    User.findById(kyc.user).then((user) => {
      if (user) {
        import('@/services/emailService').then(({ EmailService }) => {
          EmailService.sendKycRejectionEmail(user, reason).catch((err) => {
            console.error('[EMAIL] Failed to send KYC rejection email:', err);
          });
        });
      }
    });

    return kyc;
  }
}

export default KycService;
