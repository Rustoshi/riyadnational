import { Types } from 'mongoose';
import {
  User,
  Transaction,
  Deposit,
  Withdrawal,
  Transfer,
  PaymentMethod,
  Activity,
  Notification,
} from '@/models';
import { generateReference } from '@/lib/utils';
import {
  ITransaction,
  IDeposit,
  IWithdrawal,
  ITransfer,
  TransactionType,
  TransactionStatus,
  DepositStatus,
  WithdrawalStatus,
  TransferType,
  TransferStatus,
  ActivityActorType,
  NotificationType,
  UserStatus,
  KycStatus,
} from '@/types';

export class TransactionService {
  /**
   * Get user transactions
   */
  static async getUserTransactions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: TransactionType;
      status?: TransactionStatus;
    } = {}
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const { page = 1, limit = 10, type, status } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId: string): Promise<ITransaction | null> {
    return Transaction.findById(transactionId);
  }

  /**
   * Create deposit request
   */
  static async createDeposit(
    userId: string,
    amount: number,
    paymentMethodId: string,
    proofImage?: string
  ): Promise<IDeposit> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Validate amount
    if (amount < paymentMethod.minAmount || amount > paymentMethod.maxAmount) {
      throw new Error(
        `Amount must be between $${paymentMethod.minAmount} and $${paymentMethod.maxAmount}`
      );
    }

    const deposit = await Deposit.create({
      user: user._id,
      amount,
      paymentMethod: paymentMethod._id,
      proofImage,
      status: DepositStatus.PENDING,
    });

    // Create pending transaction record so users can see it in their transaction history
    const currentBalance = user.balance || 0;
    await Transaction.create({
      user: user._id,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance, // Will be updated when approved
      status: TransactionStatus.PENDING,
      description: `Deposit via ${paymentMethod.name} - ${deposit.reference}`,
      reference: deposit.reference,
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Deposit Request Created',
      message: `Your deposit request of $${amount.toFixed(2)} has been submitted and is pending approval.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'create_deposit',
      resource: 'deposit',
      resourceId: deposit._id,
      details: { amount, paymentMethod: paymentMethod.name },
    });

    return deposit;
  }

  /**
   * Get user deposits
   */
  static async getUserDeposits(
    userId: string,
    options: { page?: number; limit?: number; status?: DepositStatus } = {}
  ): Promise<{ deposits: IDeposit[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Deposit.countDocuments(query),
    ]);

    return { deposits, total };
  }

  /**
   * Process deposit (admin)
   */
  static async processDeposit(
    depositId: string,
    status: DepositStatus.APPROVED | DepositStatus.REJECTED,
    adminId: string,
    adminNote?: string
  ): Promise<IDeposit> {
    const deposit = await Deposit.findById(depositId).populate('user');
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new Error('Deposit has already been processed');
    }

    deposit.status = status;
    deposit.adminNote = adminNote;
    deposit.processedBy = new Types.ObjectId(adminId);
    deposit.processedAt = new Date();

    await deposit.save();

    // If approved, credit user balance
    if (status === DepositStatus.APPROVED) {
      const user = await User.findById(deposit.user);
      if (user) {
        const balanceBefore = user.balance;
        user.balance += deposit.amount;
        await user.save();

        // Update existing pending transaction record (created when deposit was submitted)
        await Transaction.findOneAndUpdate(
          { reference: deposit.reference },
          {
            status: TransactionStatus.COMPLETED,
            balanceBefore,
            balanceAfter: user.balance,
            description: `Deposit approved - ${deposit.reference}`,
          }
        );

        // Create notification
        await Notification.create({
          user: user._id,
          title: 'Deposit Approved',
          message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved and credited to your account.`,
          type: NotificationType.SUCCESS,
        });

        // Send deposit approval email (non-blocking)
        import('@/services/emailService').then(({ EmailService }) => {
          EmailService.sendDepositEmail(user, {
            amount: deposit.amount,
            reference: deposit.reference,
            paymentMethod: 'Bank Transfer', // TODO: Get from payment method
            status: 'approved',
            newBalance: user.balance,
            adminNote,
          }).catch((err) => {
            console.error('[EMAIL] Failed to send deposit approval email:', err);
          });
        });
      }
    } else {
      // Update transaction to failed status
      await Transaction.findOneAndUpdate(
        { reference: deposit.reference },
        {
          status: TransactionStatus.FAILED,
          description: `Deposit rejected - ${deposit.reference}`,
        }
      );

      // Create rejection notification
      const user = await User.findById(deposit.user);
      if (user) {
        await Notification.create({
          user: user._id,
          title: 'Deposit Rejected',
          message: `Your deposit of $${deposit.amount.toFixed(2)} has been rejected. ${adminNote || ''}`,
          type: NotificationType.ERROR,
        });

        // Send deposit rejection email (non-blocking)
        import('@/services/emailService').then(({ EmailService }) => {
          EmailService.sendDepositEmail(user, {
            amount: deposit.amount,
            reference: deposit.reference,
            paymentMethod: 'Bank Transfer',
            status: 'rejected',
            adminNote,
          }).catch((err) => {
            console.error('[EMAIL] Failed to send deposit rejection email:', err);
          });
        });
      }
    }

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: status === DepositStatus.APPROVED ? 'approve_deposit' : 'reject_deposit',
      resource: 'deposit',
      resourceId: deposit._id,
      details: { amount: deposit.amount, status, adminNote },
    });

    return deposit;
  }

  /**
   * Create withdrawal request
   */
  static async createWithdrawal(
    userId: string,
    amount: number,
    paymentMethodId: string,
    paymentDetails?: Record<string, unknown>
  ): Promise<IWithdrawal> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check account status - must be active
    if (user.status === UserStatus.DORMANT) {
      throw new Error(
        'Your account is currently dormant due to inactivity. To reactivate your account and process withdrawals, please contact our support team via live chat for immediate assistance.'
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error(
        'Your account has been temporarily suspended. Please contact our support team via live chat to resolve this matter and restore access to withdrawal services.'
      );
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new Error(
        'Your account access has been restricted. Please contact our support team via live chat for further assistance regarding your account status.'
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new Error(
        'Your account is currently inactive. Please contact our support team via live chat to activate your account and enable withdrawal services.'
      );
    }

    // Check KYC status
    if (user.kycStatus !== KycStatus.APPROVED) {
      throw new Error(
        'Identity verification is required before processing withdrawals. Please complete your KYC verification in your account settings, or contact our support team via live chat for assistance.'
      );
    }

    // Check balance
    if (user.balance < amount) {
      throw new Error(
        'Insufficient funds. The requested withdrawal amount exceeds your available balance. Please adjust the amount and try again.'
      );
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new Error(
        'The selected payment method is unavailable. Please choose a different withdrawal method or contact support for assistance.'
      );
    }

    // Validate amount
    if (amount < paymentMethod.minAmount || amount > paymentMethod.maxAmount) {
      throw new Error(
        `Withdrawal amount must be between $${paymentMethod.minAmount.toLocaleString()} and $${paymentMethod.maxAmount.toLocaleString()}. Please adjust your amount accordingly.`
      );
    }

    // Calculate fee
    let fee = paymentMethod.fee;
    if (paymentMethod.feeType === 'percentage') {
      fee = (amount * paymentMethod.fee) / 100;
    }

    const netAmount = amount - fee;

    // Deduct from balance
    const balanceBefore = user.balance;
    user.balance -= amount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      fee,
      netAmount,
      paymentMethod: paymentMethod._id,
      paymentDetails,
      status: WithdrawalStatus.PENDING,
    });

    // Create pending transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.WITHDRAWAL,
      amount,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.PENDING,
      description: `Withdrawal request - ${withdrawal.reference}`,
      reference: withdrawal.reference,
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Withdrawal Request Created',
      message: `Your withdrawal request of $${amount.toFixed(2)} has been submitted and is pending approval.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'create_withdrawal',
      resource: 'withdrawal',
      resourceId: withdrawal._id,
      details: { amount, fee, netAmount, paymentMethod: paymentMethod.name },
    });

    return withdrawal;
  }

  /**
   * Get user withdrawals
   */
  static async getUserWithdrawals(
    userId: string,
    options: { page?: number; limit?: number; status?: WithdrawalStatus } = {}
  ): Promise<{ withdrawals: IWithdrawal[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Withdrawal.countDocuments(query),
    ]);

    return { withdrawals, total };
  }

  /**
   * Process withdrawal (admin)
   */
  static async processWithdrawal(
    withdrawalId: string,
    status: WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED,
    adminId: string,
    adminNote?: string
  ): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('Withdrawal has already been processed');
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote;
    withdrawal.processedBy = new Types.ObjectId(adminId);
    withdrawal.processedAt = new Date();

    await withdrawal.save();

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { reference: withdrawal.reference },
      { status: status === WithdrawalStatus.APPROVED ? TransactionStatus.COMPLETED : TransactionStatus.FAILED }
    );

    const user = await User.findById(withdrawal.user);

    if (status === WithdrawalStatus.REJECTED && user) {
      // Refund the amount
      user.balance += withdrawal.amount;
      await user.save();

      // Create notification
      await Notification.create({
        user: user._id,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been rejected and refunded. ${adminNote || ''}`,
        type: NotificationType.ERROR,
      });

      // Send withdrawal rejection email (non-blocking)
      import('@/services/emailService').then(({ EmailService }) => {
        EmailService.sendWithdrawalEmail(user, {
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          netAmount: withdrawal.netAmount,
          reference: withdrawal.reference,
          paymentMethod: 'Bank Transfer',
          status: 'rejected',
          newBalance: user.balance,
          adminNote,
        }).catch((err) => {
          console.error('[EMAIL] Failed to send withdrawal rejection email:', err);
        });
      });
    } else if (user) {
      // Create success notification
      await Notification.create({
        user: user._id,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of $${withdrawal.netAmount.toFixed(2)} has been approved and is being processed.`,
        type: NotificationType.SUCCESS,
      });

      // Send withdrawal approval email (non-blocking)
      import('@/services/emailService').then(({ EmailService }) => {
        EmailService.sendWithdrawalEmail(user, {
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          netAmount: withdrawal.netAmount,
          reference: withdrawal.reference,
          paymentMethod: 'Bank Transfer',
          status: 'approved',
          newBalance: user.balance,
          adminNote,
        }).catch((err) => {
          console.error('[EMAIL] Failed to send withdrawal approval email:', err);
        });
      });
    }

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: status === WithdrawalStatus.APPROVED ? 'approve_withdrawal' : 'reject_withdrawal',
      resource: 'withdrawal',
      resourceId: withdrawal._id,
      details: { amount: withdrawal.amount, status, adminNote },
    });

    return withdrawal;
  }

  /**
   * Create internal transfer
   */
  static async createInternalTransfer(
    senderId: string,
    recipientAccountNumber: string,
    amount: number,
    description?: string
  ): Promise<ITransfer> {
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check account status - allow ACTIVE and INACTIVE (inactive users have withdrawal fee requirements shown on frontend)
    // Block only truly restricted statuses
    if (sender.status === UserStatus.SUSPENDED) {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    if (sender.status === UserStatus.BLOCKED) {
      throw new Error('Your account has been blocked. Please contact support.');
    }
    if (sender.status === UserStatus.DORMANT) {
      throw new Error('Your account is dormant due to inactivity. Please contact support to reactivate.');
    }
    if (sender.status === UserStatus.PENDING) {
      throw new Error('Your account is pending approval. Please wait for account activation.');
    }

    if (sender.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const recipient = await User.findOne({ accountNumber: recipientAccountNumber });
    if (!recipient) {
      throw new Error('Recipient account not found');
    }

    if (recipient._id.toString() === sender._id.toString()) {
      throw new Error('Cannot transfer to yourself');
    }

    // Deduct from sender
    const senderBalanceBefore = sender.balance;
    sender.balance -= amount;
    await sender.save();

    // Credit recipient
    const recipientBalanceBefore = recipient.balance;
    recipient.balance += amount;
    await recipient.save();

    // Create transfer record
    const transfer = await Transfer.create({
      sender: sender._id,
      recipient: recipient._id,
      recipientDetails: {
        accountNumber: recipient.accountNumber,
        accountName: recipient.name,
      },
      type: TransferType.INTERNAL,
      amount,
      fee: 0,
      totalAmount: amount,
      status: TransferStatus.COMPLETED,
      description,
    });

    // Create sender transaction
    await Transaction.create({
      user: sender._id,
      type: TransactionType.TRANSFER_OUT,
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: sender.balance,
      status: TransactionStatus.COMPLETED,
      description: `Transfer to ${recipient.name} - ${transfer.reference}`,
      reference: transfer.reference,
    });

    // Create recipient transaction
    await Transaction.create({
      user: recipient._id,
      type: TransactionType.TRANSFER_IN,
      amount,
      balanceBefore: recipientBalanceBefore,
      balanceAfter: recipient.balance,
      status: TransactionStatus.COMPLETED,
      description: `Transfer from ${sender.name} - ${transfer.reference}`,
      reference: `${transfer.reference}-IN`,
    });

    // Notifications
    await Notification.create({
      user: sender._id,
      title: 'Transfer Successful',
      message: `You have successfully transferred $${amount.toFixed(2)} to ${recipient.name}.`,
      type: NotificationType.SUCCESS,
    });

    await Notification.create({
      user: recipient._id,
      title: 'Money Received',
      message: `You have received $${amount.toFixed(2)} from ${sender.name}.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: sender._id,
      actorType: ActivityActorType.USER,
      action: 'internal_transfer',
      resource: 'transfer',
      resourceId: transfer._id,
      details: { amount, recipientAccountNumber },
    });

    return transfer;
  }

  /**
   * Create external transfer (local/international)
   */
  static async createExternalTransfer(
    senderId: string,
    type: TransferType.LOCAL | TransferType.INTERNATIONAL,
    recipientDetails: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode?: string;
      country?: string;
      swiftCode?: string;
      routingNumber?: string;
    },
    amount: number,
    description?: string
  ): Promise<ITransfer> {
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check account status - allow ACTIVE and INACTIVE (inactive users have withdrawal fee requirements shown on frontend)
    // Block only truly restricted statuses
    if (sender.status === UserStatus.SUSPENDED) {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    if (sender.status === UserStatus.BLOCKED) {
      throw new Error('Your account has been blocked. Please contact support.');
    }
    if (sender.status === UserStatus.DORMANT) {
      throw new Error('Your account is dormant due to inactivity. Please contact support to reactivate.');
    }
    if (sender.status === UserStatus.PENDING) {
      throw new Error('Your account is pending approval. Please wait for account activation.');
    }

    // Calculate fee (example: 1% for local, 2% for international)
    const feePercentage = type === TransferType.LOCAL ? 1 : 2;
    const fee = Math.round((amount * feePercentage) / 100 * 100) / 100;
    const totalAmount = amount + fee;

    if (sender.balance < totalAmount) {
      throw new Error('Insufficient balance (including fees)');
    }

    // Determine if codes are required (for international transfers)
    const requiresCodes = type === TransferType.INTERNATIONAL;

    // Deduct from sender
    const senderBalanceBefore = sender.balance;
    sender.balance -= totalAmount;
    await sender.save();

    // Create transfer record
    const transfer = await Transfer.create({
      sender: sender._id,
      recipientDetails,
      type,
      amount,
      fee,
      totalAmount,
      status: requiresCodes ? TransferStatus.PENDING : TransferStatus.PROCESSING,
      description,
      requiresImfCode: requiresCodes && !!sender.imfCode,
      requiresCotCode: requiresCodes && !!sender.cotCode,
      codesVerified: !requiresCodes,
    });

    // Create transaction
    await Transaction.create({
      user: sender._id,
      type: TransactionType.TRANSFER_OUT,
      amount: totalAmount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: sender.balance,
      status: TransactionStatus.PENDING,
      description: `${type === TransferType.LOCAL ? 'Local' : 'International'} transfer to ${recipientDetails.accountName} - ${transfer.reference}`,
      reference: transfer.reference,
    });

    // Create notification
    await Notification.create({
      user: sender._id,
      title: 'Transfer Initiated',
      message: `Your ${type} transfer of $${amount.toFixed(2)} has been initiated${requiresCodes ? ' and requires verification codes' : ''}.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: sender._id,
      actorType: ActivityActorType.USER,
      action: `create_${type}_transfer`,
      resource: 'transfer',
      resourceId: transfer._id,
      details: { amount, fee, recipientDetails },
    });

    return transfer;
  }

  /**
   * Verify transfer codes
   */
  static async verifyTransferCodes(
    transferId: string,
    userId: string,
    codes: { imfCode?: string; cotCode?: string }
  ): Promise<ITransfer> {
    const transfer = await Transfer.findById(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.sender.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new Error('Transfer is not pending verification');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify codes
    if (transfer.requiresImfCode && codes.imfCode !== user.imfCode) {
      throw new Error('Invalid IMF code');
    }
    if (transfer.requiresCotCode && codes.cotCode !== user.cotCode) {
      throw new Error('Invalid COT code');
    }

    transfer.codesVerified = true;
    transfer.status = TransferStatus.PROCESSING;
    await transfer.save();

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { reference: transfer.reference },
      { status: TransactionStatus.COMPLETED }
    );

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Transfer Verified',
      message: `Your transfer of $${transfer.amount.toFixed(2)} has been verified and is being processed.`,
      type: NotificationType.SUCCESS,
    });

    return transfer;
  }

  /**
   * Get user transfers
   */
  static async getUserTransfers(
    userId: string,
    options: { page?: number; limit?: number; type?: TransferType; status?: TransferStatus } = {}
  ): Promise<{ transfers: ITransfer[]; total: number }> {
    const { page = 1, limit = 10, type, status } = options;
    const query: Record<string, unknown> = { sender: new Types.ObjectId(userId) };

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      Transfer.find(query)
        .populate('recipient', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transfer.countDocuments(query),
    ]);

    return { transfers, total };
  }

  /**
   * Get all deposits (admin)
   */
  static async getAllDeposits(
    options: { page?: number; limit?: number; status?: DepositStatus } = {}
  ): Promise<{ deposits: IDeposit[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .populate('user', 'name email accountNumber')
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Deposit.countDocuments(query),
    ]);

    return { deposits, total };
  }

  /**
   * Get all withdrawals (admin)
   */
  static async getAllWithdrawals(
    options: { page?: number; limit?: number; status?: WithdrawalStatus } = {}
  ): Promise<{ withdrawals: IWithdrawal[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('user', 'name email accountNumber')
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Withdrawal.countDocuments(query),
    ]);

    return { withdrawals, total };
  }

  /**
   * Get all transfers (admin)
   */
  static async getAllTransfers(
    options: { page?: number; limit?: number; type?: TransferType; status?: TransferStatus } = {}
  ): Promise<{ transfers: ITransfer[]; total: number }> {
    const { page = 1, limit = 10, type, status } = options;
    const query: Record<string, unknown> = {};

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      Transfer.find(query)
        .populate('sender', 'name email accountNumber')
        .populate('recipient', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transfer.countDocuments(query),
    ]);

    return { transfers, total };
  }

  /**
   * Process transfer (admin)
   */
  static async processTransfer(
    transferId: string,
    status: TransferStatus.COMPLETED | TransferStatus.FAILED | TransferStatus.CANCELLED,
    adminId: string,
    adminNote?: string
  ): Promise<ITransfer> {
    const transfer = await Transfer.findById(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === TransferStatus.COMPLETED || transfer.status === TransferStatus.FAILED) {
      throw new Error('Transfer has already been finalized');
    }

    transfer.status = status;
    transfer.processedBy = new Types.ObjectId(adminId);
    transfer.processedAt = new Date();

    await transfer.save();

    // Update transaction status
    const txnStatus = status === TransferStatus.COMPLETED
      ? TransactionStatus.COMPLETED
      : TransactionStatus.FAILED;

    await Transaction.findOneAndUpdate(
      { reference: transfer.reference },
      { status: txnStatus }
    );

    const sender = await User.findById(transfer.sender);

    if (status === TransferStatus.FAILED || status === TransferStatus.CANCELLED) {
      // Refund the sender
      if (sender) {
        sender.balance += transfer.totalAmount;
        await sender.save();

        await Notification.create({
          user: sender._id,
          title: 'Transfer Failed',
          message: `Your transfer of $${transfer.amount.toFixed(2)} has failed and been refunded. ${adminNote || ''}`,
          type: NotificationType.ERROR,
        });
      }
    } else if (sender) {
      await Notification.create({
        user: sender._id,
        title: 'Transfer Completed',
        message: `Your transfer of $${transfer.amount.toFixed(2)} has been completed successfully.`,
        type: NotificationType.SUCCESS,
      });
    }

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: `process_transfer_${status}`,
      resource: 'transfer',
      resourceId: transfer._id,
      details: { amount: transfer.amount, status, adminNote },
    });

    return transfer;
  }
}

export default TransactionService;
