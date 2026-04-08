import mongoose, { Schema, Model } from 'mongoose';
import { ILoan, LoanStatus } from '@/types';
import { calculateMonthlyPayment } from '@/lib/utils';

const LoanSchema = new Schema<ILoan>(
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
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0, 'Interest rate cannot be negative'],
      default: 5,
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 month'],
    },
    monthlyPayment: {
      type: Number,
      required: [true, 'Monthly payment is required'],
    },
    totalPayable: {
      type: Number,
      required: [true, 'Total payable is required'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: {
      type: Date,
    },
    disbursedAt: {
      type: Date,
    },
    nextPaymentDate: {
      type: Date,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate payments
LoanSchema.pre('save', function () {
  if (this.isNew || this.isModified('amount') || this.isModified('interestRate') || this.isModified('durationMonths')) {
    this.monthlyPayment = calculateMonthlyPayment(
      this.amount,
      this.interestRate,
      this.durationMonths
    );
    this.totalPayable = this.monthlyPayment * this.durationMonths;
  }
});

// Index for queries
LoanSchema.index({ status: 1 });
LoanSchema.index({ user: 1, status: 1 });

// Static method to get pending loans
LoanSchema.statics.getPending = function () {
  return this.find({ status: LoanStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .sort({ createdAt: -1 });
};

// Static method to get user loans
LoanSchema.statics.getUserLoans = function (
  userId: mongoose.Types.ObjectId,
  options: { status?: LoanStatus } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to check if loan is fully paid
LoanSchema.methods.isFullyPaid = function (): boolean {
  return this.paidAmount >= this.totalPayable;
};

// Virtual for remaining balance
LoanSchema.virtual('remainingBalance').get(function () {
  return Math.max(0, this.totalPayable - this.paidAmount);
});

// Virtual for payment progress
LoanSchema.virtual('paymentProgress').get(function () {
  if (this.totalPayable === 0) return 0;
  return Math.round((this.paidAmount / this.totalPayable) * 100);
});

// Ensure virtuals are included in JSON
LoanSchema.set('toJSON', { virtuals: true });
LoanSchema.set('toObject', { virtuals: true });

// Prevent model recompilation in development
const Loan: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
