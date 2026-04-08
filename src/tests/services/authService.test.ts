import { AuthService } from '@/services/authService';
import { User, Admin } from '@/models';
import { hashPassword } from '@/lib/utils';
import { UserStatus, AdminStatus, AdminRole } from '@/types';

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      const result = await AuthService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email.toLowerCase());
      expect(result.user.name).toBe(userData.name);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Should be sanitized
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      await AuthService.register(userData);

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should handle referral code', async () => {
      // Create referrer
      const referrer = await User.create({
        email: 'referrer@example.com',
        password: await hashPassword('Password123'),
        name: 'Referrer',
        accountNumber: '1000000001',
        referralCode: 'REF1234',
      });

      const userData = {
        email: 'referred@example.com',
        password: 'Password123',
        name: 'Referred User',
        referralCode: 'REF1234',
      };

      const result = await AuthService.register(userData);

      const user = await User.findById(result.user._id);
      expect(user?.referredBy?.toString()).toBe(referrer._id.toString());
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'login@example.com',
        password: await hashPassword('Password123'),
        name: 'Login User',
        accountNumber: '1000000002',
        referralCode: 'LOG1234',
        status: UserStatus.ACTIVE,
      });
    });

    it('should login user successfully', async () => {
      const result = await AuthService.login({
        email: 'login@example.com',
        password: 'Password123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        AuthService.login({
          email: 'login@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for blocked user', async () => {
      await User.findOneAndUpdate(
        { email: 'login@example.com' },
        { status: UserStatus.BLOCKED }
      );

      await expect(
        AuthService.login({
          email: 'login@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Your account has been blocked');
    });

    it('should update last login on successful login', async () => {
      const beforeLogin = await User.findOne({ email: 'login@example.com' });
      expect(beforeLogin?.lastLogin).toBeUndefined();

      await AuthService.login({
        email: 'login@example.com',
        password: 'Password123',
      });

      const afterLogin = await User.findOne({ email: 'login@example.com' });
      expect(afterLogin?.lastLogin).toBeDefined();
    });
  });

  describe('adminLogin', () => {
    beforeEach(async () => {
      await Admin.create({
        email: 'admin@example.com',
        password: await hashPassword('AdminPass123'),
        name: 'Test Admin',
        role: AdminRole.ADMIN,
        status: AdminStatus.ACTIVE,
      });
    });

    it('should login admin successfully', async () => {
      const result = await AuthService.adminLogin({
        email: 'admin@example.com',
        password: 'AdminPass123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('admin@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error for blocked admin', async () => {
      await Admin.findOneAndUpdate(
        { email: 'admin@example.com' },
        { status: AdminStatus.BLOCKED }
      );

      await expect(
        AuthService.adminLogin({
          email: 'admin@example.com',
          password: 'AdminPass123',
        })
      ).rejects.toThrow('Your account has been blocked');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const userData = {
        email: 'refresh@example.com',
        password: 'Password123',
        name: 'Refresh User',
      };

      const registerResult = await AuthService.register(userData);
      
      // Wait a bit to ensure different token timestamps
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await AuthService.refreshToken(registerResult.refreshToken);

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Tokens should be different (new iat timestamp)
      expect(result.refreshToken).not.toBe(registerResult.refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('changePassword', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'changepass@example.com',
        password: await hashPassword('OldPassword123'),
        name: 'Change Pass User',
        accountNumber: '1000000003',
        referralCode: 'CHP1234',
      });
      userId = user._id.toString();
    });

    it('should change password successfully', async () => {
      await AuthService.changePassword(userId, 'OldPassword123', 'NewPassword123');

      // Try logging in with new password
      const result = await AuthService.login({
        email: 'changepass@example.com',
        password: 'NewPassword123',
      });

      expect(result.user).toBeDefined();
    });

    it('should throw error for incorrect current password', async () => {
      await expect(
        AuthService.changePassword(userId, 'WrongPassword', 'NewPassword123')
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('verifyEmail', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'verify@example.com',
        password: await hashPassword('Password123'),
        name: 'Verify User',
        accountNumber: '1000000004',
        referralCode: 'VER1234',
        emailVerified: false,
      });
      userId = user._id.toString();
    });

    it('should verify email successfully', async () => {
      const user = await AuthService.verifyEmail(userId);

      expect(user.emailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeDefined();
    });

    it('should throw error if already verified', async () => {
      await AuthService.verifyEmail(userId);

      await expect(AuthService.verifyEmail(userId)).rejects.toThrow(
        'Email already verified'
      );
    });
  });
});
