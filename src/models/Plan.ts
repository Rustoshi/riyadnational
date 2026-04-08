import mongoose, { Schema, Model } from 'mongoose';
import { IPlan, PlanStatus } from '@/types';

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    minAmount: {
      type: Number,
      required: [true, 'Minimum amount is required'],
      min: [0, 'Minimum amount cannot be negative'],
    },
    maxAmount: {
      type: Number,
      required: [true, 'Maximum amount is required'],
      min: [0, 'Maximum amount cannot be negative'],
    },
    returnPercentage: {
      type: Number,
      required: [true, 'Return percentage is required'],
      min: [0, 'Return percentage cannot be negative'],
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    status: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.ACTIVE,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
PlanSchema.index({ status: 1 });

// Static method to get active plans
PlanSchema.statics.getActivePlans = function () {
  return this.find({ status: PlanStatus.ACTIVE }).sort({ minAmount: 1 });
};

// Instance method to check if amount is valid for plan
PlanSchema.methods.isValidAmount = function (amount: number): boolean {
  return amount >= this.minAmount && amount <= this.maxAmount;
};

// Virtual for expected return calculation
PlanSchema.virtual('expectedReturnMultiplier').get(function () {
  return 1 + this.returnPercentage / 100;
});

// Ensure virtuals are included in JSON
PlanSchema.set('toJSON', { virtuals: true });
PlanSchema.set('toObject', { virtuals: true });

// Prevent model recompilation in development
const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
