import mongoose, { Schema, Model } from 'mongoose';
import { ICardTransaction, TransactionStatus } from '@/types';
import { generateReference } from '@/lib/utils';

const CardTransactionSchema = new Schema<ICardTransaction>(
  {
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: [true, 'Card is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['topup', 'purchase', 'withdrawal', 'refund'],
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
    merchant: {
      type: String,
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
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.COMPLETED,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate reference
CardTransactionSchema.pre('save', async function () {
  if (this.isNew && !this.reference) {
    let reference = generateReference('CTX');
    const CardTransactionModel = mongoose.model<ICardTransaction>('CardTransaction');
    let exists = await CardTransactionModel.findOne({ reference });
    while (exists) {
      reference = generateReference('CTX');
      exists = await CardTransactionModel.findOne({ reference });
    }
    this.reference = reference;
  }
});

// Index for queries
CardTransactionSchema.index({ createdAt: -1 });
CardTransactionSchema.index({ card: 1, createdAt: -1 });

// Static method to get card transactions
CardTransactionSchema.statics.getCardTransactions = function (
  cardId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number } = {}
) {
  return this.find({ card: cardId })
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Prevent model recompilation in development
const CardTransaction: Model<ICardTransaction> =
  mongoose.models.CardTransaction ||
  mongoose.model<ICardTransaction>('CardTransaction', CardTransactionSchema);

export default CardTransaction;
