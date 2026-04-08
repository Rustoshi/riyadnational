import mongoose, { Schema, Model } from 'mongoose';
import { IUserPlan, UserPlanStatus } from '@/types';

const UserPlanSchema = new Schema<IUserPlan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    expectedReturn: {
      type: Number,
      required: [true, 'Expected return is required'],
      min: [0, 'Expected return cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(UserPlanStatus),
      default: UserPlanStatus.ACTIVE,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    returnPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
UserPlanSchema.index({ status: 1 });
UserPlanSchema.index({ user: 1, status: 1 });
UserPlanSchema.index({ endDate: 1 });

// Static method to get active user plans
UserPlanSchema.statics.getActiveUserPlans = function (
  userId: mongoose.Types.ObjectId
) {
  return this.find({ user: userId, status: UserPlanStatus.ACTIVE })
    .populate('plan')
    .sort({ createdAt: -1 });
};

// Static method to get matured plans
UserPlanSchema.statics.getMaturedPlans = function () {
  return this.find({
    status: UserPlanStatus.ACTIVE,
    endDate: { $lte: new Date() },
    returnPaid: false,
  })
    .populate('user')
    .populate('plan');
};

// Instance method to check if plan is matured
UserPlanSchema.methods.isMatured = function (): boolean {
  return new Date() >= this.endDate;
};

// Virtual for days remaining
UserPlanSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for progress percentage
UserPlanSchema.virtual('progress').get(function () {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
});

// Ensure virtuals are included in JSON
UserPlanSchema.set('toJSON', { virtuals: true });
UserPlanSchema.set('toObject', { virtuals: true });

// Prevent model recompilation in development
const UserPlan: Model<IUserPlan> =
  mongoose.models.UserPlan || mongoose.model<IUserPlan>('UserPlan', UserPlanSchema);

export default UserPlan;
