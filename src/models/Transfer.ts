import mongoose, { Schema, Model } from 'mongoose';
import { ITransfer, TransferType, TransferStatus, IRecipientDetails } from '@/types';
import { generateReference } from '@/lib/utils';

const RecipientDetailsSchema = new Schema<IRecipientDetails>(
  {
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
    },
    bankName: {
      type: String,
    },
    bankCode: {
      type: String,
    },
    country: {
      type: String,
    },
    swiftCode: {
      type: String,
    },
    routingNumber: {
      type: String,
    },
  },
  { _id: false }
);

const TransferSchema = new Schema<ITransfer>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    recipientDetails: {
      type: RecipientDetailsSchema,
      required: [true, 'Recipient details are required'],
    },
    type: {
      type: String,
      enum: Object.values(TransferType),
      required: [true, 'Transfer type is required'],
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
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
    },
    reference: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
    },
    scheduledDate: {
      type: Date,
    },

    // Verification codes required
    requiresImfCode: {
      type: Boolean,
      default: false,
    },
    requiresCotCode: {
      type: Boolean,
      default: false,
    },
    codesVerified: {
      type: Boolean,
      default: false,
    },

    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    processedAt: {
      type: Date,
    },
    
    // Metadata for verification codes, OTP, etc.
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate reference and calculate total
TransferSchema.pre('save', async function () {
  if (this.isNew) {
    if (!this.reference) {
      const prefix = this.type === TransferType.INTERNAL ? 'INT' : 
                     this.type === TransferType.LOCAL ? 'LOC' : 'IWT';
      let reference = generateReference(prefix);
      const TransferModel = mongoose.model<ITransfer>('Transfer');
      let exists = await TransferModel.findOne({ reference });
      while (exists) {
        reference = generateReference(prefix);
        exists = await TransferModel.findOne({ reference });
      }
      this.reference = reference;
    }

    // Calculate total amount if not set
    if (!this.totalAmount) {
      this.totalAmount = this.amount + this.fee;
    }
  }
});

// Index for queries
TransferSchema.index({ createdAt: -1 });
TransferSchema.index({ status: 1 });
TransferSchema.index({ sender: 1, status: 1 });
TransferSchema.index({ type: 1, status: 1 });

// Static method to get pending transfers
TransferSchema.statics.getPending = function () {
  return this.find({ status: TransferStatus.PENDING })
    .populate('sender', 'name email accountNumber')
    .populate('recipient', 'name email accountNumber')
    .sort({ createdAt: -1 });
};

// Static method to get user transfers
TransferSchema.statics.getUserTransfers = function (
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: TransferStatus; type?: TransferType } = {}
) {
  const query: Record<string, unknown> = { sender: userId };
  if (options.status) {
    query.status = options.status;
  }
  if (options.type) {
    query.type = options.type;
  }
  return this.find(query)
    .populate('recipient', 'name email accountNumber')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Instance method to check if codes are required
TransferSchema.methods.requiresCodes = function (): boolean {
  return this.requiresImfCode || this.requiresCotCode;
};

// Prevent model recompilation in development
const Transfer: Model<ITransfer> =
  mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);

export default Transfer;
