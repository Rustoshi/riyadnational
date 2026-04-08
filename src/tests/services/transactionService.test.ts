import { TransactionService } from '@/services/transactionService';
import { User, PaymentMethod, Deposit, Withdrawal, Transfer, Transaction } from '@/models';
import { hashPassword } from '@/lib/utils';
import {
  UserStatus,
  KycStatus,
  DepositStatus,
  WithdrawalStatus,
  TransferStatus,
  TransferType,
  PaymentMethodType,
  PaymentMethodStatus,
  FeeType,
} from '@/types';

describe('TransactionService', () => {
  let testUser: any;
  let testUser2: any;
  let paymentMethod: any;
  let adminId: string;

  beforeEach(async () => {
    adminId = '507f1f77bcf86cd799439011';

    testUser = await User.create({
      email: 'sender@example.com',
      password: await hashPassword('Password123'),
      name: 'Sender User',
      accountNumber: '1000000001',
      referralCode: 'SND1234',
      balance: 5000,
      status: UserStatus.ACTIVE,
      kycStatus: KycStatus.APPROVED,
    });

    testUser2 = await User.create({
      email: 'recipient@example.com',
      password: await hashPassword('Password123'),
      name: 'Recipient User',
      accountNumber: '1000000002',
      referralCode: 'RCP1234',
      balance: 1000,
      status: UserStatus.ACTIVE,
    });

    paymentMethod = await PaymentMethod.create({
      name: 'Bank Transfer',
      type: PaymentMethodType.BANK,
      details: { bankName: 'Test Bank', accountNumber: '123456789' },
      minAmount: 10,
      maxAmount: 10000,
      fee: 5,
      feeType: FeeType.FIXED,
      status: PaymentMethodStatus.ACTIVE,
    });
  });

  describe('createDeposit', () => {
    it('should create deposit request', async () => {
      const deposit = await TransactionService.createDeposit(
        testUser._id.toString(),
        500,
        paymentMethod._id.toString()
      );

      expect(deposit).toBeDefined();
      expect(deposit.amount).toBe(500);
      expect(deposit.status).toBe(DepositStatus.PENDING);
      expect(deposit.reference).toBeDefined();
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        TransactionService.createDeposit(
          testUser._id.toString(),
          5, // Below minimum
          paymentMethod._id.toString()
        )
      ).rejects.toThrow('Amount must be between');
    });

    it('should throw error for non-existent payment method', async () => {
      await expect(
        TransactionService.createDeposit(
          testUser._id.toString(),
          500,
          '507f1f77bcf86cd799439011'
        )
      ).rejects.toThrow('Payment method not found');
    });
  });

  describe('getUserDeposits', () => {
    beforeEach(async () => {
      await Deposit.create([
        {
          user: testUser._id,
          amount: 100,
          paymentMethod: paymentMethod._id,
          status: DepositStatus.PENDING,
          reference: 'DEP001',
        },
        {
          user: testUser._id,
          amount: 200,
          paymentMethod: paymentMethod._id,
          status: DepositStatus.APPROVED,
          reference: 'DEP002',
        },
      ]);
    });

    it('should return user deposits', async () => {
      const result = await TransactionService.getUserDeposits(testUser._id.toString());

      expect(result.deposits).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      const result = await TransactionService.getUserDeposits(testUser._id.toString(), {
        status: DepositStatus.PENDING,
      });

      expect(result.deposits).toHaveLength(1);
      expect(result.deposits[0].status).toBe(DepositStatus.PENDING);
    });
  });

  describe('processDeposit', () => {
    let deposit: any;

    beforeEach(async () => {
      deposit = await Deposit.create({
        user: testUser._id,
        amount: 500,
        paymentMethod: paymentMethod._id,
        status: DepositStatus.PENDING,
        reference: 'DEP003',
      });
    });

    it('should approve deposit and credit user', async () => {
      const initialBalance = testUser.balance;

      const processedDeposit = await TransactionService.processDeposit(
        deposit._id.toString(),
        DepositStatus.APPROVED,
        adminId
      );

      expect(processedDeposit.status).toBe(DepositStatus.APPROVED);
      expect(processedDeposit.processedBy).toBeDefined();
      expect(processedDeposit.processedAt).toBeDefined();

      // Check user balance was credited
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.balance).toBe(initialBalance + 500);

      // Check transaction was created
      const transaction = await Transaction.findOne({ reference: deposit.reference });
      expect(transaction).toBeDefined();
    });

    it('should reject deposit without crediting user', async () => {
      const initialBalance = testUser.balance;

      const processedDeposit = await TransactionService.processDeposit(
        deposit._id.toString(),
        DepositStatus.REJECTED,
        adminId,
        'Invalid proof'
      );

      expect(processedDeposit.status).toBe(DepositStatus.REJECTED);
      expect(processedDeposit.adminNote).toBe('Invalid proof');

      // Check user balance unchanged
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.balance).toBe(initialBalance);
    });

    it('should throw error for already processed deposit', async () => {
      await TransactionService.processDeposit(
        deposit._id.toString(),
        DepositStatus.APPROVED,
        adminId
      );

      await expect(
        TransactionService.processDeposit(
          deposit._id.toString(),
          DepositStatus.REJECTED,
          adminId
        )
      ).rejects.toThrow('Deposit has already been processed');
    });
  });

  describe('createWithdrawal', () => {
    it('should create withdrawal request', async () => {
      const initialBalance = testUser.balance;

      const withdrawal = await TransactionService.createWithdrawal(
        testUser._id.toString(),
        500,
        paymentMethod._id.toString()
      );

      expect(withdrawal).toBeDefined();
      expect(withdrawal.amount).toBe(500);
      expect(withdrawal.fee).toBe(5);
      expect(withdrawal.netAmount).toBe(495);
      expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);

      // Check balance was deducted
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.balance).toBe(initialBalance - 500);
    });

    it('should throw error for insufficient balance', async () => {
      await expect(
        TransactionService.createWithdrawal(
          testUser._id.toString(),
          10000, // More than balance
          paymentMethod._id.toString()
        )
      ).rejects.toThrow('Insufficient balance');
    });

    it('should throw error for non-KYC verified user', async () => {
      await User.findByIdAndUpdate(testUser._id, { kycStatus: KycStatus.PENDING });

      await expect(
        TransactionService.createWithdrawal(
          testUser._id.toString(),
          500,
          paymentMethod._id.toString()
        )
      ).rejects.toThrow('KYC verification required');
    });
  });

  describe('processWithdrawal', () => {
    let withdrawal: any;

    beforeEach(async () => {
      // Deduct balance first (simulating withdrawal creation)
      testUser.balance -= 500;
      await testUser.save();

      withdrawal = await Withdrawal.create({
        user: testUser._id,
        amount: 500,
        fee: 5,
        netAmount: 495,
        paymentMethod: paymentMethod._id,
        status: WithdrawalStatus.PENDING,
        reference: 'WDR001',
      });

      await Transaction.create({
        user: testUser._id,
        type: 'withdrawal',
        amount: 500,
        balanceBefore: 5000,
        balanceAfter: 4500,
        status: 'pending',
        description: 'Withdrawal request',
        reference: 'WDR001',
      });
    });

    it('should approve withdrawal', async () => {
      const processedWithdrawal = await TransactionService.processWithdrawal(
        withdrawal._id.toString(),
        WithdrawalStatus.APPROVED,
        adminId
      );

      expect(processedWithdrawal.status).toBe(WithdrawalStatus.APPROVED);
    });

    it('should reject withdrawal and refund user', async () => {
      const balanceBeforeRefund = (await User.findById(testUser._id))?.balance || 0;

      const processedWithdrawal = await TransactionService.processWithdrawal(
        withdrawal._id.toString(),
        WithdrawalStatus.REJECTED,
        adminId,
        'Suspicious activity'
      );

      expect(processedWithdrawal.status).toBe(WithdrawalStatus.REJECTED);

      // Check refund
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.balance).toBe(balanceBeforeRefund + 500);
    });
  });

  describe('createInternalTransfer', () => {
    it('should create internal transfer', async () => {
      const senderInitialBalance = testUser.balance;
      const recipientInitialBalance = testUser2.balance;

      const transfer = await TransactionService.createInternalTransfer(
        testUser._id.toString(),
        testUser2.accountNumber,
        500,
        'Test transfer'
      );

      expect(transfer).toBeDefined();
      expect(transfer.amount).toBe(500);
      expect(transfer.fee).toBe(0);
      expect(transfer.status).toBe(TransferStatus.COMPLETED);
      expect(transfer.type).toBe(TransferType.INTERNAL);

      // Check balances
      const updatedSender = await User.findById(testUser._id);
      const updatedRecipient = await User.findById(testUser2._id);

      expect(updatedSender?.balance).toBe(senderInitialBalance - 500);
      expect(updatedRecipient?.balance).toBe(recipientInitialBalance + 500);
    });

    it('should throw error for insufficient balance', async () => {
      await expect(
        TransactionService.createInternalTransfer(
          testUser._id.toString(),
          testUser2.accountNumber,
          10000
        )
      ).rejects.toThrow('Insufficient balance');
    });

    it('should throw error for self transfer', async () => {
      await expect(
        TransactionService.createInternalTransfer(
          testUser._id.toString(),
          testUser.accountNumber,
          500
        )
      ).rejects.toThrow('Cannot transfer to yourself');
    });

    it('should throw error for non-existent recipient', async () => {
      await expect(
        TransactionService.createInternalTransfer(
          testUser._id.toString(),
          '9999999999',
          500
        )
      ).rejects.toThrow('Recipient account not found');
    });
  });

  describe('createExternalTransfer', () => {
    it('should create local transfer', async () => {
      const transfer = await TransactionService.createExternalTransfer(
        testUser._id.toString(),
        TransferType.LOCAL,
        {
          accountNumber: '123456789',
          accountName: 'External User',
          bankName: 'External Bank',
          bankCode: 'EXT001',
        },
        1000
      );

      expect(transfer).toBeDefined();
      expect(transfer.amount).toBe(1000);
      expect(transfer.fee).toBe(10); // 1% fee
      expect(transfer.totalAmount).toBe(1010);
      expect(transfer.type).toBe(TransferType.LOCAL);
    });

    it('should create international transfer with code requirements', async () => {
      // Set up user with codes
      await User.findByIdAndUpdate(testUser._id, {
        taxCode: 'TAX123',
        imfCode: 'IMF456',
      });

      const transfer = await TransactionService.createExternalTransfer(
        testUser._id.toString(),
        TransferType.INTERNATIONAL,
        {
          accountNumber: '123456789',
          accountName: 'International User',
          bankName: 'International Bank',
          country: 'UK',
          swiftCode: 'SWIFT123',
        },
        1000
      );

      expect(transfer).toBeDefined();
      expect(transfer.fee).toBe(20); // 2% fee
      expect(transfer.status).toBe(TransferStatus.PENDING);
      expect(transfer.requiresTaxCode).toBe(true);
      expect(transfer.requiresImfCode).toBe(true);
      expect(transfer.codesVerified).toBe(false);
    });
  });

  describe('verifyTransferCodes', () => {
    let transfer: any;

    beforeEach(async () => {
      await User.findByIdAndUpdate(testUser._id, {
        taxCode: 'TAX123',
        imfCode: 'IMF456',
        balance: 5000,
      });

      transfer = await Transfer.create({
        sender: testUser._id,
        recipientDetails: {
          accountNumber: '123456789',
          accountName: 'Test',
          bankName: 'Test Bank',
        },
        type: TransferType.INTERNATIONAL,
        amount: 1000,
        fee: 20,
        totalAmount: 1020,
        status: TransferStatus.PENDING,
        requiresTaxCode: true,
        requiresImfCode: true,
        requiresCotCode: false,
        codesVerified: false,
        reference: 'IWT001',
      });
    });

    it('should verify codes and update transfer status', async () => {
      const verifiedTransfer = await TransactionService.verifyTransferCodes(
        transfer._id.toString(),
        testUser._id.toString(),
        { taxCode: 'TAX123', imfCode: 'IMF456' }
      );

      expect(verifiedTransfer.codesVerified).toBe(true);
      expect(verifiedTransfer.status).toBe(TransferStatus.PROCESSING);
    });

    it('should throw error for invalid codes', async () => {
      await expect(
        TransactionService.verifyTransferCodes(
          transfer._id.toString(),
          testUser._id.toString(),
          { taxCode: 'WRONG', imfCode: 'IMF456' }
        )
      ).rejects.toThrow('Invalid TAX code');
    });
  });

  describe('getAllDeposits (admin)', () => {
    beforeEach(async () => {
      await Deposit.create([
        {
          user: testUser._id,
          amount: 100,
          paymentMethod: paymentMethod._id,
          status: DepositStatus.PENDING,
          reference: 'DEP001',
        },
        {
          user: testUser2._id,
          amount: 200,
          paymentMethod: paymentMethod._id,
          status: DepositStatus.APPROVED,
          reference: 'DEP002',
        },
      ]);
    });

    it('should return all deposits', async () => {
      const result = await TransactionService.getAllDeposits();

      expect(result.deposits).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      const result = await TransactionService.getAllDeposits({
        status: DepositStatus.PENDING,
      });

      expect(result.deposits).toHaveLength(1);
    });
  });

  describe('processTransfer (admin)', () => {
    let transfer: any;

    beforeEach(async () => {
      transfer = await Transfer.create({
        sender: testUser._id,
        recipientDetails: {
          accountNumber: '123456789',
          accountName: 'Test',
          bankName: 'Test Bank',
        },
        type: TransferType.LOCAL,
        amount: 1000,
        fee: 10,
        totalAmount: 1010,
        status: TransferStatus.PROCESSING,
        codesVerified: true,
        reference: 'LOC001',
      });

      // Deduct from sender
      testUser.balance -= 1010;
      await testUser.save();

      await Transaction.create({
        user: testUser._id,
        type: 'transfer_out',
        amount: 1010,
        balanceBefore: 5000,
        balanceAfter: 3990,
        status: 'pending',
        description: 'Transfer',
        reference: 'LOC001',
      });
    });

    it('should complete transfer', async () => {
      const processedTransfer = await TransactionService.processTransfer(
        transfer._id.toString(),
        TransferStatus.COMPLETED,
        adminId
      );

      expect(processedTransfer.status).toBe(TransferStatus.COMPLETED);
    });

    it('should fail transfer and refund', async () => {
      const balanceBefore = (await User.findById(testUser._id))?.balance || 0;

      const processedTransfer = await TransactionService.processTransfer(
        transfer._id.toString(),
        TransferStatus.FAILED,
        adminId,
        'Bank rejected'
      );

      expect(processedTransfer.status).toBe(TransferStatus.FAILED);

      // Check refund
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.balance).toBe(balanceBefore + 1010);
    });
  });
});
