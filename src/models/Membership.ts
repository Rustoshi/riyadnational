import mongoose, { Schema, Model } from 'mongoose';
import { IMembership, MembershipStatus } from '@/types';

const MembershipSchema = new Schema<IMembership>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    features: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MembershipSchema.index({ status: 1 });

// Static methods
MembershipSchema.statics.getActive = function () {
  return this.find({ status: MembershipStatus.ACTIVE }).sort({ price: 1 });
};

export const Membership: Model<IMembership> =
  mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);

export default Membership;
