import mongoose, { Schema, Model } from 'mongoose';
import { IDeposit, DepositStatus } from '@/types';
import { generateReference } from '@/lib/utils';

const DepositSchema = new Schema<IDeposit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: Object.values(DepositStatus),
      default: DepositStatus.PENDING,
    },
    reference: {
      type: String,
      unique: true,
      index: true,
    },
    proofImage: {
      type: String,
    },
    adminNote: {
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

// Pre-save middleware to generate reference
DepositSchema.pre('save', async function () {
  if (this.isNew && !this.reference) {
    let reference = generateReference('DEP');
    const DepositModel = mongoose.model<IDeposit>('Deposit');
    let exists = await DepositModel.findOne({ reference });
    while (exists) {
      reference = generateReference('DEP');
      exists = await DepositModel.findOne({ reference });
    }
    this.reference = reference;
  }
});

// Index for queries
DepositSchema.index({ createdAt: -1 });
DepositSchema.index({ status: 1 });
DepositSchema.index({ user: 1, status: 1 });

// Static method to get pending deposits
DepositSchema.statics.getPending = function () {
  return this.find({ status: DepositStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .populate('paymentMethod', 'name type')
    .sort({ createdAt: -1 });
};

// Static method to get user deposits
DepositSchema.statics.getUserDeposits = function (
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: DepositStatus } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query)
    .populate('paymentMethod', 'name type')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Prevent model recompilation in development
const Deposit: Model<IDeposit> =
  mongoose.models.Deposit || mongoose.model<IDeposit>('Deposit', DepositSchema);

export default Deposit;
