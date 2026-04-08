import mongoose, { Schema, Model } from 'mongoose';
import { ICopyPosition, CopyTradingStatus } from '@/types';

const CopyPositionSchema = new Schema<ICopyPosition>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trader: {
      type: Schema.Types.ObjectId,
      ref: 'CopyTrader',
      required: true,
    },
    investedAmount: {
      type: Number,
      required: [true, 'Invested amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(CopyTradingStatus),
      default: CopyTradingStatus.ACTIVE,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CopyPositionSchema.index({ user: 1, trader: 1 });
CopyPositionSchema.index({ status: 1 });

// Static methods
CopyPositionSchema.statics.getActiveByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({ user: userId, status: CopyTradingStatus.ACTIVE }).populate('trader');
};

CopyPositionSchema.statics.getActiveByTrader = function (traderId: mongoose.Types.ObjectId) {
  return this.find({ trader: traderId, status: CopyTradingStatus.ACTIVE }).populate(
    'user',
    'name email'
  );
};

export const CopyPosition: Model<ICopyPosition> =
  mongoose.models.CopyPosition || mongoose.model<ICopyPosition>('CopyPosition', CopyPositionSchema);

export default CopyPosition;
