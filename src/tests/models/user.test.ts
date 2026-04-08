import { User } from '@/models';
import { hashPassword } from '@/lib/utils';
import { UserStatus, KycStatus, AccountType } from '@/types';

describe('User Model', () => {
  describe('creation', () => {
    it('should create a user with required fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: await hashPassword('Password123'),
        name: 'Test User',
      });

      expect(user._id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.accountNumber).toBeDefined();
      expect(user.referralCode).toBeDefined();

    });

    it('should auto-generate account number', async () => {
      const user = await User.create({
        email: 'account@example.com',
        password: await hashPassword('Password123'),
        name: 'Account User',
      });

      expect(user.accountNumber).toMatch(/^10\d{8}$/);
    });

    it('should auto-generate referral code', async () => {
      const user = await User.create({
        email: 'referral@example.com',
        password: await hashPassword('Password123'),
        name: 'Referral User',
      });

      expect(user.referralCode).toMatch(/^[A-Z]{3}\d{4}$/);
    });

    it('should set default values', async () => {
      const user = await User.create({
        email: 'defaults@example.com',
        password: await hashPassword('Password123'),
        name: 'Default User',
      });

      expect(user.balance).toBe(0);
      expect(user.bonus).toBe(0);
      expect(user.tradingBalance).toBe(0);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.kycStatus).toBe(KycStatus.NOT_SUBMITTED);
      expect(user.emailVerified).toBe(false);
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.emailNotifications).toBe(true);
      expect(user.smsNotifications).toBe(false);
      expect(user.theme).toBe('light');
      expect(user.accountType).toBe(AccountType.SAVINGS);
      expect(user.dailyTransferLimit).toBe(10000);
      expect(user.dailyWithdrawalLimit).toBe(5000);
    });

    it('should lowercase email', async () => {
      const user = await User.create({
        email: 'UPPERCASE@EXAMPLE.COM',
        password: await hashPassword('Password123'),
        name: 'Uppercase User',
      });

      expect(user.email).toBe('uppercase@example.com');
    });

    it('should enforce unique email', async () => {
      await User.create({
        email: 'unique@example.com',
        password: await hashPassword('Password123'),
        name: 'First User',
      });

      await expect(
        User.create({
          email: 'unique@example.com',
          password: await hashPassword('Password123'),
          name: 'Second User',
        })
      ).rejects.toThrow();
    });

    it('should enforce unique account number', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        password: await hashPassword('Password123'),
        name: 'User 1',
      });

      await expect(
        User.create({
          email: 'user2@example.com',
          password: await hashPassword('Password123'),
          name: 'User 2',
          accountNumber: user1.accountNumber,
        })
      ).rejects.toThrow();
    });
  });

  describe('validation', () => {
    it('should require email', async () => {
      await expect(
        User.create({
          password: await hashPassword('Password123'),
          name: 'No Email User',
        })
      ).rejects.toThrow('Email is required');
    });

    it('should require password', async () => {
      await expect(
        User.create({
          email: 'nopass@example.com',
          name: 'No Password User',
        })
      ).rejects.toThrow('Password is required');
    });

    it('should require name', async () => {
      await expect(
        User.create({
          email: 'noname@example.com',
          password: await hashPassword('Password123'),
        })
      ).rejects.toThrow('Name is required');
    });

    it('should enforce minimum password length', async () => {
      await expect(
        User.create({
          email: 'shortpass@example.com',
          password: 'short',
          name: 'Short Pass User',
        })
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should not allow negative balance', async () => {
      const user = await User.create({
        email: 'negbal@example.com',
        password: await hashPassword('Password123'),
        name: 'Negative Balance User',
      });

      user.balance = -100;
      await expect(user.save()).rejects.toThrow('Balance cannot be negative');
    });
  });

  describe('referral', () => {
    it('should store referredBy reference', async () => {
      const referrer = await User.create({
        email: 'referrer@example.com',
        password: await hashPassword('Password123'),
        name: 'Referrer',
      });

      const referred = await User.create({
        email: 'referred@example.com',
        password: await hashPassword('Password123'),
        name: 'Referred',
        referredBy: referrer._id,
      });

      expect(referred.referredBy?.toString()).toBe(referrer._id.toString());
    });
  });

  describe('indexes', () => {
    it('should find user by email efficiently', async () => {
      await User.create({
        email: 'indexed@example.com',
        password: await hashPassword('Password123'),
        name: 'Indexed User',
      });

      const user = await User.findOne({ email: 'indexed@example.com' });
      expect(user).toBeDefined();
    });

    it('should find user by account number efficiently', async () => {
      const created = await User.create({
        email: 'account@example.com',
        password: await hashPassword('Password123'),
        name: 'Account User',
      });

      const user = await User.findOne({ accountNumber: created.accountNumber });
      expect(user).toBeDefined();
      expect(user?._id.toString()).toBe(created._id.toString());
    });

    it('should find user by referral code efficiently', async () => {
      const created = await User.create({
        email: 'refcode@example.com',
        password: await hashPassword('Password123'),
        name: 'Ref Code User',
      });

      const user = await User.findOne({ referralCode: created.referralCode });
      expect(user).toBeDefined();
      expect(user?._id.toString()).toBe(created._id.toString());
    });
  });

  describe('virtuals', () => {
    it('should have displayName virtual', async () => {
      const user = await User.create({
        email: 'virtual@example.com',
        password: await hashPassword('Password123'),
        name: 'Virtual User',
      });

      expect(user.toJSON().displayName).toBe('Virtual User');
    });
  });
});
