import mongoose, { Schema, Model } from 'mongoose';
import { IPaymentMethod, PaymentMethodType, PaymentMethodStatus, FeeType } from '@/types';

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PaymentMethodType),
      required: [true, 'Type is required'],
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    instructions: {
      type: String,
    },
    minAmount: {
      type: Number,
      default: 1,
      min: [0, 'Minimum amount cannot be negative'],
    },
    maxAmount: {
      type: Number,
      default: 1000000,
      min: [0, 'Maximum amount cannot be negative'],
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative'],
    },
    feeType: {
      type: String,
      enum: Object.values(FeeType),
      default: FeeType.FIXED,
    },
    status: {
      type: String,
      enum: Object.values(PaymentMethodStatus),
      default: PaymentMethodStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
PaymentMethodSchema.index({ status: 1 });
PaymentMethodSchema.index({ type: 1, status: 1 });

// Static method to get active payment methods
PaymentMethodSchema.statics.getActive = function (type?: PaymentMethodType) {
  const query: Record<string, unknown> = { status: PaymentMethodStatus.ACTIVE };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ name: 1 });
};

// Instance method to calculate fee
PaymentMethodSchema.methods.calculateFee = function (amount: number): number {
  if (this.feeType === FeeType.FIXED) {
    return this.fee;
  }
  return Math.round((amount * this.fee) / 100 * 100) / 100;
};

// Instance method to check if amount is valid
PaymentMethodSchema.methods.isValidAmount = function (amount: number): boolean {
  return amount >= this.minAmount && amount <= this.maxAmount;
};

// Prevent model recompilation in development
const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);

export default PaymentMethod;
