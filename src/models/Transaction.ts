import mongoose, { Schema, Model } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus } from '@/types';
import { generateReference } from '@/lib/utils';

const TransactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    balanceBefore: {
      type: Number,
      required: [true, 'Balance before is required'],
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after is required'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.COMPLETED,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    reference: {
      type: String,
      unique: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate reference
TransactionSchema.pre('save', async function () {
  if (this.isNew && !this.reference) {
    let reference = generateReference('TXN');
    const TransactionModel = mongoose.model<ITransaction>('Transaction');
    let exists = await TransactionModel.findOne({ reference });
    while (exists) {
      reference = generateReference('TXN');
      exists = await TransactionModel.findOne({ reference });
    }
    this.reference = reference;
  }
});

// Index for date-based queries
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ user: 1, type: 1 });

// Static method to get user transactions
TransactionSchema.statics.getUserTransactions = function (
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; type?: TransactionType } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.type) {
    query.type = options.type;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Static method to get user balance summary
TransactionSchema.statics.getBalanceSummary = async function (
  userId: mongoose.Types.ObjectId
) {
  const result = await this.aggregate([
    { $match: { user: userId, status: TransactionStatus.COMPLETED } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  return result;
};

// Prevent model recompilation in development
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
