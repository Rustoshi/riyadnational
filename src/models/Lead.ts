import mongoose, { Schema, Model } from 'mongoose';
import { ILead, LeadStatus } from '@/types';

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
    },
    phone: {
      type: String,
    },
    source: {
      type: String,
    },
    notes: {
      type: String,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
    },
    convertedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    convertedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ createdAt: -1 });

// Static methods
LeadSchema.statics.getByStatus = function (status: LeadStatus) {
  return this.find({ status })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

LeadSchema.statics.getByAssignee = function (adminId: mongoose.Types.ObjectId) {
  return this.find({ assignedTo: adminId }).sort({ createdAt: -1 });
};

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
