import mongoose, { Schema, Model } from 'mongoose';
import { ICryptoTransaction, CryptoTransactionType, CryptoTransactionStatus } from '@/types';
import { generateReference } from '@/lib/utils';

const CryptoTransactionSchema = new Schema<ICryptoTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CryptoTransactionType),
      required: true,
    },
    fromAsset: {
      type: String,
      required: true,
    },
    toAsset: {
      type: String,
      required: true,
    },
    fromAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    toAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(CryptoTransactionStatus),
      default: CryptoTransactionStatus.PENDING,
    },
    reference: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
CryptoTransactionSchema.pre('save', async function () {
  if (this.isNew && !this.reference) {
    let reference = generateReference('CRY');
    const CryptoTransactionModel = mongoose.model<ICryptoTransaction>('CryptoTransaction');
    let exists = await CryptoTransactionModel.findOne({ reference });
    while (exists) {
      reference = generateReference('CRY');
      exists = await CryptoTransactionModel.findOne({ reference });
    }
    this.reference = reference;
  }
});

// Indexes
CryptoTransactionSchema.index({ createdAt: -1 });
CryptoTransactionSchema.index({ user: 1, createdAt: -1 });

export const CryptoTransaction: Model<ICryptoTransaction> =
  mongoose.models.CryptoTransaction ||
  mongoose.model<ICryptoTransaction>('CryptoTransaction', CryptoTransactionSchema);

export default CryptoTransaction;
