import mongoose, { Schema, Model } from 'mongoose';
import { ISignal, SignalStatus } from '@/types';

const SignalSchema = new Schema<ISignal>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'SignalProvider',
      required: true,
      index: true,
    },
    asset: {
      type: String,
      required: [true, 'Asset is required'],
    },
    action: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
    },
    takeProfit: {
      type: Number,
      required: [true, 'Take profit is required'],
    },
    stopLoss: {
      type: Number,
      required: [true, 'Stop loss is required'],
    },
    status: {
      type: String,
      enum: Object.values(SignalStatus),
      default: SignalStatus.ACTIVE,
    },
    result: {
      type: String,
      enum: ['win', 'loss'],
    },
    profitLoss: {
      type: Number,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SignalSchema.index({ createdAt: -1 });
SignalSchema.index({ provider: 1, status: 1 });

// Static methods
SignalSchema.statics.getActiveByProvider = function (providerId: mongoose.Types.ObjectId) {
  return this.find({ provider: providerId, status: SignalStatus.ACTIVE }).sort({ createdAt: -1 });
};

export const Signal: Model<ISignal> =
  mongoose.models.Signal || mongoose.model<ISignal>('Signal', SignalSchema);

export default Signal;
