import crypto from 'crypto';
import { User, Admin, PasswordReset, Activity } from '@/models';
import { ActivityActorType, IUser } from '@/types';
import {
  sendEmail,
  sendBatchEmails,
  getWelcomeEmailTemplate,
  getWelcomeEmailSubject,
  getPasswordResetEmailTemplate,
  getPasswordResetEmailSubject,
  getPasswordResetSuccessEmailTemplate,
  getPasswordResetSuccessEmailSubject,
  getKycSubmissionEmailTemplate,
  getKycSubmissionEmailSubject,
  getKycApprovalEmailTemplate,
  getKycApprovalEmailSubject,
  getKycRejectionEmailTemplate,
  getKycRejectionEmailSubject,
  getDepositEmailTemplate,
  getDepositEmailSubject,
  getWithdrawalEmailTemplate,
  getWithdrawalEmailSubject,
  getCreditAlertEmailTemplate,
  getCreditAlertEmailSubject,
  getDebitAlertEmailTemplate,
  getDebitAlertEmailSubject,
  getAccountApprovalEmailTemplate,
  getAccountApprovalEmailSubject,
  getRegistrationReceivedEmailTemplate,
  getRegistrationReceivedEmailSubject,
  getBaseTemplate,
  EmailTemplateProps,
} from '@/lib/email';

// Site settings helper
async function getSiteSettings(): Promise<{ siteName: string; siteEmail: string; siteUrl: string }> {
  try {
    const { default: Settings } = await import('@/models/Settings');
    // Use find to get all settings and convert to object
    const settings = await Settings.find({});
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = String(s.value);
    });
    return {
      siteName: settingsObj.siteName || process.env.SITE_NAME || '',
      siteEmail: settingsObj.siteEmail || process.env.EMAIL_FROM || 'support@example.com',
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
  } catch {
    return {
      siteName: process.env.SITE_NAME || '',
      siteEmail: process.env.EMAIL_FROM || 'support@example.com',
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
  }
}

// Get base email props
async function getEmailProps(): Promise<EmailTemplateProps> {
  const settings = await getSiteSettings();
  return {
    companyName: settings.siteName,
    companyEmail: settings.siteEmail,
  };
}

export class EmailService {
  /**
   * Generate verification token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(user: IUser): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getWelcomeEmailTemplate({
      ...emailProps,
      userName: user.name,
      userEmail: user.email,
      accountNumber: user.accountNumber || 'Pending',
      loginUrl: `${settings.siteUrl}/login`,
    });

    await sendEmail({
      to: user.email,
      subject: getWelcomeEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send registration received email (account under review)
   */
  static async sendRegistrationReceivedEmail(user: { email: string; name: string }): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getRegistrationReceivedEmailTemplate({
      ...emailProps,
      userName: user.name,
    });

    await sendEmail({
      to: user.email,
      subject: getRegistrationReceivedEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send welcome email with credentials (for admin-created users)
   */
  static async sendWelcomeEmailWithCredentials(user: IUser, password: string): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${settings.siteName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px;">Welcome to ${settings.siteName}!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${user.name},
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Your account has been created successfully. Here are your login credentials:
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: #333;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 0 0 10px; color: #333;"><strong>Password:</strong> ${password}</p>
                <p style="margin: 0; color: #333;"><strong>Account Number:</strong> ${user.accountNumber || 'Pending'}</p>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                For security reasons, we recommend changing your password after your first login.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${settings.siteUrl}/login" style="display: inline-block; padding: 14px 30px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Login to Your Account
                </a>
              </div>
              <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                If you did not request this account, please contact our support team immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: `Welcome to ${settings.siteName} - Your Account Details`,
      html,
    });
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(userId: string): Promise<{ token: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    const token = this.generateToken();
    const settings = await getSiteSettings();

    // For now, log the token - in production, send verification email
    console.log(`[EMAIL] Verification email to ${user.email} with token: ${token}`);

    return { token };
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'verify_email',
      resource: 'user',
      resourceId: user._id,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Delete any existing reset tokens
    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await PasswordReset.create({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();
    const resetUrl = `${settings.siteUrl}/reset-password?token=${token}`;

    const html = getPasswordResetEmailTemplate({
      ...emailProps,
      userName: user.name,
      resetUrl,
      expiresIn: '1 hour',
      ipAddress,
      userAgent,
    });

    await sendEmail({
      to: user.email,
      subject: getPasswordResetEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send password reset success email
   */
  static async sendPasswordResetSuccessEmail(user: IUser): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getPasswordResetSuccessEmailTemplate({
      ...emailProps,
      userName: user.name,
      loginUrl: `${settings.siteUrl}/login`,
    });

    await sendEmail({
      to: user.email,
      subject: getPasswordResetSuccessEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Verify password reset token
   */
  static async verifyResetToken(token: string): Promise<string | null> {
    const reset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    return reset?.email || null;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await User.findOne({ email: reset.email });
    if (!user) {
      throw new Error('User not found');
    }

    // Import hash function
    const { hashPassword } = await import('@/lib/utils');
    user.password = await hashPassword(newPassword);
    await user.save();

    // Delete the reset token
    await PasswordReset.deleteOne({ _id: reset._id });

    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'reset_password',
      resource: 'user',
      resourceId: user._id,
    });
  }

  /**
   * Send email to single user
   */
  static async sendToUser(
    userId: string,
    subject: string,
    message: string,
    adminId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In production, send actual email
    console.log(`[EMAIL] To: ${user.email}, Subject: ${subject}, Message: ${message}`);

    await Activity.create({
      actor: adminId,
      actorType: ActivityActorType.ADMIN,
      action: 'send_email',
      resource: 'user',
      resourceId: user._id,
      details: { subject },
    });
  }

  /**
   * Send email to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    subject: string,
    message: string,
    adminId: string
  ): Promise<number> {
    const users = await User.find({ _id: { $in: userIds } });

    for (const user of users) {
      // In production, send actual email (consider using queue)
      console.log(`[EMAIL] To: ${user.email}, Subject: ${subject}`);
    }

    await Activity.create({
      actor: adminId,
      actorType: ActivityActorType.ADMIN,
      action: 'send_bulk_email',
      resource: 'user',
      details: { subject, recipientCount: users.length },
    });

    return users.length;
  }

  /**
   * Send email to all users
   */
  static async sendToAllUsers(
    subject: string,
    message: string,
    adminId: string
  ): Promise<number> {
    const users = await User.find({}, 'email');

    for (const user of users) {
      // In production, use email queue
      console.log(`[EMAIL] To: ${user.email}, Subject: ${subject}`);
    }

    await Activity.create({
      actor: adminId,
      actorType: ActivityActorType.ADMIN,
      action: 'send_email_all',
      resource: 'user',
      details: { subject, recipientCount: users.length },
    });

    return users.length;
  }

  /**
   * Admin password reset
   */
  static async sendAdminPasswordResetEmail(email: string): Promise<void> {
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return;
    }

    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await PasswordReset.create({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    console.log(`[EMAIL] Admin password reset to ${email} with token: ${token}`);
  }

  /**
   * Reset admin password
   */
  static async resetAdminPassword(token: string, newPassword: string): Promise<void> {
    const reset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      throw new Error('Invalid or expired reset token');
    }

    const admin = await Admin.findOne({ email: reset.email });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const { hashPassword } = await import('@/lib/utils');
    admin.password = await hashPassword(newPassword);
    await admin.save();

    await PasswordReset.deleteOne({ _id: reset._id });
  }

  // ==================== KYC EMAILS ====================

  /**
   * Send KYC submission confirmation email
   */
  static async sendKycSubmissionEmail(user: IUser, documentType: string): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getKycSubmissionEmailTemplate({
      ...emailProps,
      userName: user.name,
      documentType,
      submittedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    await sendEmail({
      to: user.email,
      subject: getKycSubmissionEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send KYC approval email
   */
  static async sendKycApprovalEmail(user: IUser): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getKycApprovalEmailTemplate({
      ...emailProps,
      userName: user.name,
      approvedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      dashboardUrl: `${settings.siteUrl}/dashboard`,
    });

    await sendEmail({
      to: user.email,
      subject: getKycApprovalEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send KYC rejection email
   */
  static async sendKycRejectionEmail(user: IUser, rejectionReason: string): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getKycRejectionEmailTemplate({
      ...emailProps,
      userName: user.name,
      rejectionReason,
      rejectedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      resubmitUrl: `${settings.siteUrl}/dashboard/kyc`,
    });

    await sendEmail({
      to: user.email,
      subject: getKycRejectionEmailSubject(settings.siteName),
      html,
    });
  }

  /**
   * Send account approval email
   */
  static async sendAccountApprovalEmail(user: IUser): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getAccountApprovalEmailTemplate({
      ...emailProps,
      userName: user.name,
      loginUrl: `${settings.siteUrl}/login`,
    });

    await sendEmail({
      to: user.email,
      subject: getAccountApprovalEmailSubject(settings.siteName),
      html,
    });
  }

  // ==================== TRANSACTION EMAILS ====================

  /**
   * Send deposit email (pending, approved, or rejected)
   */
  static async sendDepositEmail(
    user: IUser,
    data: {
      amount: number;
      reference: string;
      paymentMethod: string;
      status: 'pending' | 'approved' | 'rejected';
      newBalance?: number;
      adminNote?: string;
    }
  ): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getDepositEmailTemplate({
      ...emailProps,
      userName: user.name,
      amount: data.amount.toFixed(2),
      reference: data.reference,
      paymentMethod: data.paymentMethod,
      status: data.status,
      newBalance: data.newBalance?.toFixed(2),
      transactionDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      adminNote: data.adminNote,
      dashboardUrl: `${settings.siteUrl}/dashboard/transactions`,
    });

    await sendEmail({
      to: user.email,
      subject: getDepositEmailSubject(settings.siteName, data.status, `$${data.amount.toFixed(2)}`),
      html,
    });
  }

  /**
   * Send withdrawal email (pending, approved, or rejected)
   */
  static async sendWithdrawalEmail(
    user: IUser,
    data: {
      amount: number;
      fee: number;
      netAmount: number;
      reference: string;
      paymentMethod: string;
      paymentDetails?: string;
      status: 'pending' | 'approved' | 'rejected';
      newBalance?: number;
      adminNote?: string;
    }
  ): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getWithdrawalEmailTemplate({
      ...emailProps,
      userName: user.name,
      amount: data.amount.toFixed(2),
      fee: data.fee.toFixed(2),
      netAmount: data.netAmount.toFixed(2),
      reference: data.reference,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
      status: data.status,
      newBalance: data.newBalance?.toFixed(2),
      transactionDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      adminNote: data.adminNote,
      dashboardUrl: `${settings.siteUrl}/dashboard/transactions`,
    });

    await sendEmail({
      to: user.email,
      subject: getWithdrawalEmailSubject(settings.siteName, data.status, `$${data.amount.toFixed(2)}`),
      html,
    });
  }

  /**
   * Send credit alert email (admin credited user)
   */
  static async sendCreditAlertEmail(
    user: IUser,
    data: {
      amount: number;
      description: string;
      newBalance: number;
    }
  ): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getCreditAlertEmailTemplate({
      ...emailProps,
      userName: user.name,
      amount: data.amount.toFixed(2),
      description: data.description,
      newBalance: data.newBalance.toFixed(2),
      transactionDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dashboardUrl: `${settings.siteUrl}/dashboard`,
    });

    await sendEmail({
      to: user.email,
      subject: getCreditAlertEmailSubject(settings.siteName, `$${data.amount.toFixed(2)}`),
      html,
    });
  }

  /**
   * Send debit alert email (admin debited user)
   */
  static async sendDebitAlertEmail(
    user: IUser,
    data: {
      amount: number;
      description: string;
      newBalance: number;
    }
  ): Promise<void> {
    const settings = await getSiteSettings();
    const emailProps = await getEmailProps();

    const html = getDebitAlertEmailTemplate({
      ...emailProps,
      userName: user.name,
      amount: data.amount.toFixed(2),
      description: data.description,
      newBalance: data.newBalance.toFixed(2),
      transactionDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dashboardUrl: `${settings.siteUrl}/dashboard`,
    });

    await sendEmail({
      to: user.email,
      subject: getDebitAlertEmailSubject(settings.siteName, `$${data.amount.toFixed(2)}`),
      html,
    });
  }

  /**
   * Send Transfer OTP Email
   */
  static async sendTransferOtpEmail(
    user: { email: string; name: string },
    data: {
      otp: string;
      amount: number;
      recipientName: string;
      transferType: string;
      expiryMinutes: number;
    }
  ): Promise<void> {
    const settings = await getSiteSettings();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Verification OTP</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${settings.siteName}</h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Transfer Verification</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      You have initiated a ${data.transferType} transfer of <strong>$${data.amount.toFixed(2)}</strong> to <strong>${data.recipientName}</strong>.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      Please use the following One-Time Password (OTP) to complete your transfer:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); padding: 20px 40px; border-radius: 12px;">
                        <span style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">${data.otp}</span>
                      </div>
                    </div>
                    
                    <p style="margin: 20px 0; color: #dc2626; font-size: 14px; text-align: center;">
                      ⏱️ This OTP will expire in <strong>${data.expiryMinutes} minutes</strong>.
                    </p>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your OTP.
                      </p>
                    </div>
                    
                    <p style="margin: 25px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      If you did not initiate this transfer, please contact our support team immediately.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                      © ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: `[${settings.siteName}] Transfer Verification OTP - ${data.otp}`,
      html,
    });
  }
}

export default EmailService;
