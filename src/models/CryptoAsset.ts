import mongoose, { Schema, Model } from 'mongoose';
import { ICryptoAsset } from '@/types';

const CryptoAssetSchema = new Schema<ICryptoAsset>(
  {
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    change24h: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CryptoAssetSchema.index({ isActive: 1 });

// Static methods
CryptoAssetSchema.statics.getActive = function () {
  return this.find({ isActive: true }).sort({ symbol: 1 });
};

export const CryptoAsset: Model<ICryptoAsset> =
  mongoose.models.CryptoAsset || mongoose.model<ICryptoAsset>('CryptoAsset', CryptoAssetSchema);

export default CryptoAsset;
