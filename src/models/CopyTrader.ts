import mongoose, { Schema, Model } from 'mongoose';
import { ICopyTrader, CopyTradingStatus } from '@/types';

const CopyTraderSchema = new Schema<ICopyTrader>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    description: {
      type: String,
    },
    avatar: {
      type: String,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    copiers: {
      type: Number,
      default: 0,
    },
    minInvestment: {
      type: Number,
      default: 100,
      min: 0,
    },
    profitShare: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(CopyTradingStatus),
      default: CopyTradingStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CopyTraderSchema.index({ status: 1 });
CopyTraderSchema.index({ totalProfit: -1 });
CopyTraderSchema.index({ winRate: -1 });

// Static methods
CopyTraderSchema.statics.getActive = function () {
  return this.find({ status: CopyTradingStatus.ACTIVE }).sort({ totalProfit: -1 });
};

export const CopyTrader: Model<ICopyTrader> =
  mongoose.models.CopyTrader || mongoose.model<ICopyTrader>('CopyTrader', CopyTraderSchema);

export default CopyTrader;
