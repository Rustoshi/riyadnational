import mongoose, { Schema, Model, Document } from 'mongoose';

// IRS Refund Setting interface
export interface IIrsRefundSetting extends Document {
  _id: mongoose.Types.ObjectId;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingTime: number;
  instructions: string;
  enableRefunds: boolean;
  requireVerification: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IrsRefundSettingSchema = new Schema<IIrsRefundSetting>(
  {
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAmount: {
      type: Number,
      default: 10000,
      min: 0,
    },
    processingFee: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    processingTime: {
      type: Number,
      default: 5,
      min: 1,
    },
    instructions: {
      type: String,
      default: 'Please provide your IRS filing information to process your refund request.',
    },
    enableRefunds: {
      type: Boolean,
      default: true,
    },
    requireVerification: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
IrsRefundSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const IrsRefundSetting: Model<IIrsRefundSetting> =
  mongoose.models.IrsRefundSetting || mongoose.model<IIrsRefundSetting>('IrsRefundSetting', IrsRefundSettingSchema);

export default IrsRefundSetting;
