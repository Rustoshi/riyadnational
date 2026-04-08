import mongoose, { Schema, Model } from 'mongoose';
import { ISignalProvider, SignalProviderStatus } from '@/types';

const SignalProviderSchema = new Schema<ISignalProvider>(
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
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalSignals: {
      type: Number,
      default: 0,
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    followers: {
      type: Number,
      default: 0,
    },
    subscriptionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(SignalProviderStatus),
      default: SignalProviderStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SignalProviderSchema.index({ status: 1 });
SignalProviderSchema.index({ winRate: -1 });

// Static methods
SignalProviderSchema.statics.getActive = function () {
  return this.find({ status: SignalProviderStatus.ACTIVE }).sort({ winRate: -1 });
};

export const SignalProvider: Model<ISignalProvider> =
  mongoose.models.SignalProvider ||
  mongoose.model<ISignalProvider>('SignalProvider', SignalProviderSchema);

export default SignalProvider;
