import mongoose, { Schema, Model } from 'mongoose';
import { IWithdrawal, WithdrawalStatus } from '@/types';
import { generateReference } from '@/lib/utils';

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative'],
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: [0, 'Net amount cannot be negative'],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: [true, 'Payment method is required'],
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.PENDING,
    },
    reference: {
      type: String,
      unique: true,
      index: true,
    },
    adminNote: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate reference and calculate net amount
WithdrawalSchema.pre('save', async function () {
  if (this.isNew) {
    if (!this.reference) {
      let reference = generateReference('WDR');
      const WithdrawalModel = mongoose.model<IWithdrawal>('Withdrawal');
      let exists = await WithdrawalModel.findOne({ reference });
      while (exists) {
        reference = generateReference('WDR');
        exists = await WithdrawalModel.findOne({ reference });
      }
      this.reference = reference;
    }

    // Calculate net amount if not set
    if (!this.netAmount) {
      this.netAmount = this.amount - this.fee;
    }
  }
});

// Index for queries
WithdrawalSchema.index({ createdAt: -1 });
WithdrawalSchema.index({ status: 1 });
WithdrawalSchema.index({ user: 1, status: 1 });

// Static method to get pending withdrawals
WithdrawalSchema.statics.getPending = function () {
  return this.find({ status: WithdrawalStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .populate('paymentMethod', 'name type')
    .sort({ createdAt: -1 });
};

// Static method to get user withdrawals
WithdrawalSchema.statics.getUserWithdrawals = function (
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: WithdrawalStatus } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query)
    .populate('paymentMethod', 'name type')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Prevent model recompilation in development
const Withdrawal: Model<IWithdrawal> =
  mongoose.models.Withdrawal ||
  mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

export default Withdrawal;
