import mongoose, { Schema, Model } from 'mongoose';
import { ISignalSubscription } from '@/types';

const SignalSubscriptionSchema = new Schema<ISignalSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'SignalProvider',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SignalSubscriptionSchema.index({ user: 1, provider: 1 });
SignalSubscriptionSchema.index({ status: 1 });
SignalSubscriptionSchema.index({ endDate: 1 });

// Static methods
SignalSubscriptionSchema.statics.getActiveByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({
    user: userId,
    status: 'active',
    endDate: { $gte: new Date() },
  }).populate('provider');
};

export const SignalSubscription: Model<ISignalSubscription> =
  mongoose.models.SignalSubscription ||
  mongoose.model<ISignalSubscription>('SignalSubscription', SignalSubscriptionSchema);

export default SignalSubscription;
