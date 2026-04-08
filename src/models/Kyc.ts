import mongoose, { Schema, Model } from 'mongoose';
import { IKyc, KycStatus, DocumentType } from '@/types';

const KycSchema = new Schema<IKyc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required'],
    },
    documentNumber: {
      type: String,
      required: [true, 'Document number is required'],
    },
    frontImage: {
      type: String,
      required: [true, 'Front image is required'],
    },
    backImage: {
      type: String,
    },
    selfieImage: {
      type: String,
      required: [true, 'Selfie image is required'],
    },
    status: {
      type: String,
      enum: Object.values(KycStatus),
      default: KycStatus.PENDING,
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
KycSchema.index({ status: 1 });

// Static method to get pending KYC applications
KycSchema.statics.getPending = function () {
  return this.find({ status: KycStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .sort({ createdAt: -1 });
};

// Static method to get user KYC
KycSchema.statics.getUserKyc = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ user: userId });
};

// Prevent model recompilation in development
const Kyc: Model<IKyc> =
  mongoose.models.Kyc || mongoose.model<IKyc>('Kyc', KycSchema);

export default Kyc;
