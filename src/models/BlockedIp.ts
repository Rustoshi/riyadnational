import mongoose, { Schema, Model } from 'mongoose';
import { IBlockedIp } from '@/types';

const BlockedIpSchema = new Schema<IBlockedIp>(
  {
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      unique: true,
    },
    reason: {
      type: String,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (ipAddress already has unique index from schema)
BlockedIpSchema.index({ expiresAt: 1 });

// Static methods
BlockedIpSchema.statics.isBlocked = async function (ipAddress: string): Promise<boolean> {
  const blocked = await this.findOne({
    ipAddress,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  return !!blocked;
};

BlockedIpSchema.statics.getAll = function () {
  return this.find().populate('blockedBy', 'name email').sort({ createdAt: -1 });
};

export const BlockedIp: Model<IBlockedIp> =
  mongoose.models.BlockedIp || mongoose.model<IBlockedIp>('BlockedIp', BlockedIpSchema);

export default BlockedIp;
