import mongoose, { Schema, Model } from 'mongoose';
import { ICryptoWallet } from '@/types';

const CryptoWalletSchema = new Schema<ICryptoWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    asset: {
      type: String,
      required: true,
      uppercase: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
CryptoWalletSchema.index({ user: 1, asset: 1 }, { unique: true });

// Static methods
CryptoWalletSchema.statics.getOrCreate = async function (
  userId: mongoose.Types.ObjectId,
  asset: string
) {
  let wallet = await this.findOne({ user: userId, asset: asset.toUpperCase() });
  if (!wallet) {
    wallet = await this.create({ user: userId, asset: asset.toUpperCase(), balance: 0 });
  }
  return wallet;
};

export const CryptoWallet: Model<ICryptoWallet> =
  mongoose.models.CryptoWallet || mongoose.model<ICryptoWallet>('CryptoWallet', CryptoWalletSchema);

export default CryptoWallet;
