import { Types } from 'mongoose';
import { Loan, User, Transaction, Activity, Notification } from '@/models';
import { calculateMonthlyPayment } from '@/lib/utils';
import {
  ILoan,
  LoanStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
  KycStatus,
} from '@/types';

export class LoanService {
  /**
   * Get user loans
   */
  static async getUserLoans(
    userId: string,
    options: { status?: LoanStatus; page?: number; limit?: number } = {}
  ): Promise<{ loans: ILoan[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      Loan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Loan.countDocuments(query),
    ]);

    return { loans, total };
  }

  /**
   * Get loan by ID
   */
  static async getLoanById(loanId: string): Promise<ILoan | null> {
    return Loan.findById(loanId);
  }

  /**
   * Apply for a loan
   */
  static async applyLoan(
    userId: string,
    data: {
      amount: number;
      durationMonths: number;
      purpose: string;
    }
  ): Promise<ILoan> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check KYC status
    if (user.kycStatus !== KycStatus.APPROVED) {
      throw new Error('KYC verification required for loan applications');
    }

    // Check for existing active loan
    const existingLoan = await Loan.findOne({
      user: userId,
      status: { $in: [LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.ACTIVE] },
    });

    if (existingLoan) {
      throw new Error('You already have an active or pending loan');
    }

    // Default interest rate (can be configured)
    const interestRate = 5;

    // Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(
      data.amount,
      interestRate,
      data.durationMonths
    );
    const totalPayable = monthlyPayment * data.durationMonths;

    const loan = await Loan.create({
      user: user._id,
      amount: data.amount,
      interestRate,
      durationMonths: data.durationMonths,
      monthlyPayment,
      totalPayable,
      purpose: data.purpose,
      status: LoanStatus.PENDING,
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Loan Application Submitted',
      message: `Your loan application for $${data.amount.toFixed(2)} has been submitted and is pending approval.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'apply_loan',
      resource: 'loan',
      resourceId: loan._id,
      details: data,
    });

    return loan;
  }

  /**
   * Admin: Get all loans
   */
  static async getAllLoans(
    options: { status?: LoanStatus; page?: number; limit?: number } = {}
  ): Promise<{ loans: ILoan[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Loan.countDocuments(query),
    ]);

    return { loans, total };
  }

  /**
   * Admin: Approve loan
   */
  static async approveLoan(loanId: string, adminId: string): Promise<ILoan> {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new Error('Loan is not pending');
    }

    loan.status = LoanStatus.APPROVED;
    loan.approvedBy = new Types.ObjectId(adminId);
    loan.approvedAt = new Date();
    await loan.save();

    // Notify user
    await Notification.create({
      user: loan.user,
      title: 'Loan Approved',
      message: `Your loan of $${loan.amount.toFixed(2)} has been approved and is ready for disbursement.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'approve_loan',
      resource: 'loan',
      resourceId: loan._id,
    });

    return loan;
  }

  /**
   * Admin: Reject loan
   */
  static async rejectLoan(
    loanId: string,
    adminId: string,
    reason?: string
  ): Promise<ILoan> {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new Error('Loan is not pending');
    }

    loan.status = LoanStatus.REJECTED;
    await loan.save();

    // Notify user
    await Notification.create({
      user: loan.user,
      title: 'Loan Rejected',
      message: `Your loan application has been rejected. ${reason || ''}`,
      type: NotificationType.ERROR,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'reject_loan',
      resource: 'loan',
      resourceId: loan._id,
      details: { reason },
    });

    return loan;
  }

  /**
   * Admin: Disburse loan
   */
  static async disburseLoan(loanId: string, adminId: string): Promise<ILoan> {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== LoanStatus.APPROVED) {
      throw new Error('Loan must be approved before disbursement');
    }

    const user = await User.findById(loan.user);
    if (!user) {
      throw new Error('User not found');
    }

    // Credit user account
    const balanceBefore = user.balance;
    user.balance += loan.amount;
    await user.save();

    // Update loan status
    loan.status = LoanStatus.ACTIVE;
    loan.disbursedAt = new Date();
    
    // Set next payment date (30 days from now)
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
    loan.nextPaymentDate = nextPaymentDate;
    
    await loan.save();

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.LOAN,
      amount: loan.amount,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.COMPLETED,
      description: 'Loan disbursement',
      metadata: { loanId: loan._id },
    });

    // Notify user
    await Notification.create({
      user: user._id,
      title: 'Loan Disbursed',
      message: `$${loan.amount.toFixed(2)} has been credited to your account. Monthly payment: $${loan.monthlyPayment.toFixed(2)}`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'disburse_loan',
      resource: 'loan',
      resourceId: loan._id,
      details: { amount: loan.amount },
    });

    return loan;
  }

  /**
   * Record loan payment
   */
  static async recordPayment(
    loanId: string,
    amount: number,
    adminId: string
  ): Promise<ILoan> {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error('Loan is not active');
    }

    loan.paidAmount += amount;

    // Check if loan is fully paid
    if (loan.paidAmount >= loan.totalPayable) {
      loan.status = LoanStatus.PAID;
    } else {
      // Update next payment date
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
      loan.nextPaymentDate = nextPaymentDate;
    }

    await loan.save();

    // Notify user
    await Notification.create({
      user: loan.user,
      title: 'Loan Payment Recorded',
      message: `A payment of $${amount.toFixed(2)} has been recorded. Remaining: $${(loan.totalPayable - loan.paidAmount).toFixed(2)}`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'record_loan_payment',
      resource: 'loan',
      resourceId: loan._id,
      details: { amount, paidAmount: loan.paidAmount },
    });

    return loan;
  }
}

export default LoanService;
