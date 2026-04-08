import { UserService } from '@/services/userService';
import { User, Transaction } from '@/models';
import { hashPassword } from '@/lib/utils';
import { UserStatus, TransactionType, TransactionStatus } from '@/types';

describe('UserService', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'testuser@example.com',
      password: await hashPassword('Password123'),
      name: 'Test User',
      accountNumber: '1000000001',
      referralCode: 'TST1234',
      balance: 1000,
      bonus: 100,
      tradingBalance: 500,
      status: UserStatus.ACTIVE,
    });
  });

  describe('getById', () => {
    it('should return user by ID', async () => {
      const user = await UserService.getById(testUser._id.toString());
      expect(user).toBeDefined();
      expect(user?.email).toBe('testuser@example.com');
    });

    it('should return null for non-existent ID', async () => {
      const user = await UserService.getById('507f1f77bcf86cd799439011');
      expect(user).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const user = await UserService.getByEmail('testuser@example.com');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
    });

    it('should be case insensitive', async () => {
      const user = await UserService.getByEmail('TESTUSER@EXAMPLE.COM');
      expect(user).toBeDefined();
    });
  });

  describe('getByAccountNumber', () => {
    it('should return user by account number', async () => {
      const user = await UserService.getByAccountNumber('1000000001');
      expect(user).toBeDefined();
      expect(user?.email).toBe('testuser@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = await UserService.updateProfile(testUser._id.toString(), {
        name: 'Updated Name',
        phone: '+1234567890',
        country: 'USA',
        city: 'New York',
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.phone).toBe('+1234567890');
      expect(updatedUser.country).toBe('USA');
      expect(updatedUser.city).toBe('New York');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        UserService.updateProfile('507f1f77bcf86cd799439011', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePin', () => {
    it('should set PIN for first time', async () => {
      await UserService.changePin(testUser._id.toString(), undefined, '1234');

      const isValid = await UserService.verifyPin(testUser._id.toString(), '1234');
      expect(isValid).toBe(true);
    });

    it('should change existing PIN', async () => {
      await UserService.changePin(testUser._id.toString(), undefined, '1234');
      await UserService.changePin(testUser._id.toString(), '1234', '5678');

      const isValid = await UserService.verifyPin(testUser._id.toString(), '5678');
      expect(isValid).toBe(true);
    });

    it('should throw error for incorrect current PIN', async () => {
      await UserService.changePin(testUser._id.toString(), undefined, '1234');

      await expect(
        UserService.changePin(testUser._id.toString(), '0000', '5678')
      ).rejects.toThrow('Current PIN is incorrect');
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const updatedUser = await UserService.updateSettings(testUser._id.toString(), {
        emailNotifications: false,
        smsNotifications: true,
        theme: 'dark',
      });

      expect(updatedUser.emailNotifications).toBe(false);
      expect(updatedUser.smsNotifications).toBe(true);
      expect(updatedUser.theme).toBe('dark');
    });
  });

  describe('getDashboardData', () => {
    beforeEach(async () => {
      // Create some transactions
      await Transaction.create([
        {
          user: testUser._id,
          type: TransactionType.DEPOSIT,
          amount: 500,
          balanceBefore: 500,
          balanceAfter: 1000,
          status: TransactionStatus.COMPLETED,
          description: 'Test deposit',
          reference: 'TXN001',
        },
        {
          user: testUser._id,
          type: TransactionType.WITHDRAWAL,
          amount: 200,
          balanceBefore: 1000,
          balanceAfter: 800,
          status: TransactionStatus.COMPLETED,
          description: 'Test withdrawal',
          reference: 'TXN002',
        },
      ]);
    });

    it('should return dashboard data', async () => {
      const data = await UserService.getDashboardData(testUser._id.toString());

      expect(data.user).toBeDefined();
      expect(data.recentTransactions).toHaveLength(2);
      expect(data.stats.totalDeposits).toBe(500);
      expect(data.stats.totalWithdrawals).toBe(200);
    });
  });

  describe('getAll (admin)', () => {
    beforeEach(async () => {
      // Create additional users
      await User.create([
        {
          email: 'user2@example.com',
          password: await hashPassword('Password123'),
          name: 'User Two',
          accountNumber: '1000000002',
          referralCode: 'USR2234',
          status: UserStatus.ACTIVE,
        },
        {
          email: 'user3@example.com',
          password: await hashPassword('Password123'),
          name: 'User Three',
          accountNumber: '1000000003',
          referralCode: 'USR3234',
          status: UserStatus.BLOCKED,
        },
      ]);
    });

    it('should return paginated users', async () => {
      const result = await UserService.getAll({ page: 1, limit: 10 });

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await UserService.getAll({ status: UserStatus.BLOCKED });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('user3@example.com');
    });

    it('should search users', async () => {
      const result = await UserService.getAll({ search: 'Two' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('User Two');
    });
  });

  describe('topupBalance (admin)', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should topup user balance', async () => {
      const updatedUser = await UserService.topupBalance(
        testUser._id.toString(),
        { amount: 500, type: 'balance', description: 'Admin topup' },
        adminId
      );

      expect(updatedUser.balance).toBe(1500);

      // Check transaction was created
      const transactions = await Transaction.find({ user: testUser._id });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(500);
    });

    it('should topup bonus', async () => {
      const updatedUser = await UserService.topupBalance(
        testUser._id.toString(),
        { amount: 50, type: 'bonus' },
        adminId
      );

      expect(updatedUser.bonus).toBe(150);
    });
  });

  describe('deductBalance (admin)', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should deduct user balance', async () => {
      const updatedUser = await UserService.deductBalance(
        testUser._id.toString(),
        { amount: 200, type: 'balance', description: 'Admin deduction' },
        adminId
      );

      expect(updatedUser.balance).toBe(800);
    });

    it('should throw error for insufficient balance', async () => {
      await expect(
        UserService.deductBalance(
          testUser._id.toString(),
          { amount: 2000, type: 'balance' },
          adminId
        )
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('blockUser / unblockUser', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should block user', async () => {
      const blockedUser = await UserService.blockUser(testUser._id.toString(), adminId);
      expect(blockedUser.status).toBe(UserStatus.BLOCKED);
    });

    it('should unblock user', async () => {
      await UserService.blockUser(testUser._id.toString(), adminId);
      const unblockedUser = await UserService.unblockUser(testUser._id.toString(), adminId);
      expect(unblockedUser.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('deleteUser', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should delete user', async () => {
      await UserService.deleteUser(testUser._id.toString(), adminId);

      const user = await User.findById(testUser._id);
      expect(user).toBeNull();
    });
  });

  describe('updateAuthCodes', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should update authorization codes', async () => {
      const updatedUser = await UserService.updateAuthCodes(
        testUser._id.toString(),
        { taxCode: 'TAX123', imfCode: 'IMF456', cotCode: 'COT789' },
        adminId
      );

      expect(updatedUser.taxCode).toBe('TAX123');
      expect(updatedUser.imfCode).toBe('IMF456');
      expect(updatedUser.cotCode).toBe('COT789');
    });
  });

  describe('updateLimits', () => {
    let adminId: string;

    beforeEach(async () => {
      adminId = '507f1f77bcf86cd799439011';
    });

    it('should update user limits', async () => {
      const updatedUser = await UserService.updateLimits(
        testUser._id.toString(),
        { dailyTransferLimit: 50000, dailyWithdrawalLimit: 25000 },
        adminId
      );

      expect(updatedUser.dailyTransferLimit).toBe(50000);
      expect(updatedUser.dailyWithdrawalLimit).toBe(25000);
    });
  });
});
