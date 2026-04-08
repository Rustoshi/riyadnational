import { getBaseTemplate, EmailTemplateProps } from './base';

export interface PasswordResetEmailProps extends EmailTemplateProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
  ipAddress?: string;
  userAgent?: string;
}

export function getPasswordResetEmailTemplate(props: PasswordResetEmailProps): string {
  const { userName, resetUrl, expiresIn, ipAddress, userAgent } = props;

  const content = `
    <div class="content">
      <h2>Password Reset Request 🔐</h2>
      <p>Dear ${userName},</p>
      <p>
        We received a request to reset the password for your ${props.companyName} account. 
        If you made this request, click the button below to reset your password.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="button">Reset Your Password</a>
      </div>

      <div class="info-box">
        <p style="margin: 0; color: #475569; font-size: 14px;">
          <strong>⏰ This link will expire in ${expiresIn}.</strong>
        </p>
      </div>

      ${ipAddress || userAgent ? `
      <div class="info-box" style="background-color: #FEF3C7;">
        <p style="margin: 0 0 8px 0; color: #92400E; font-size: 14px; font-weight: 600;">
          ⚠️ Request Details
        </p>
        ${ipAddress ? `<p style="margin: 0; color: #92400E; font-size: 12px;">IP Address: ${ipAddress}</p>` : ''}
        ${userAgent ? `<p style="margin: 0; color: #92400E; font-size: 12px;">Device: ${userAgent}</p>` : ''}
      </div>
      ` : ''}

      <div class="divider"></div>

      <p style="font-size: 14px; color: #DC2626;">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email or contact our support 
        team immediately. Your password will remain unchanged.
      </p>

      <p style="font-size: 14px; color: #475569;">
        For security reasons, never share this link with anyone. ${props.companyName} will never 
        ask you for your password via email or phone.
      </p>

      <p style="margin-top: 24px;">
        Stay secure,<br>
        <strong>The ${props.companyName} Security Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getPasswordResetEmailSubject(companyName: string): string {
  return `Reset Your ${companyName} Password`;
}

// Password Reset Success Email
export interface PasswordResetSuccessEmailProps extends EmailTemplateProps {
  userName: string;
  loginUrl: string;
}

export function getPasswordResetSuccessEmailTemplate(props: PasswordResetSuccessEmailProps): string {
  const { userName, loginUrl } = props;

  const content = `
    <div class="content">
      <h2>Password Successfully Changed ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Your ${props.companyName} account password has been successfully changed. 
        You can now log in with your new password.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" class="button">Log In Now</a>
      </div>

      <div class="info-box" style="background-color: #FEE2E2;">
        <p style="margin: 0; color: #DC2626; font-size: 14px;">
          <strong>⚠️ Wasn't you?</strong><br>
          If you didn't change your password, please contact our support team immediately 
          and secure your account.
        </p>
      </div>

      <p style="margin-top: 24px;">
        Stay secure,<br>
        <strong>The ${props.companyName} Security Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getPasswordResetSuccessEmailSubject(companyName: string): string {
  return `Your ${companyName} Password Has Been Changed`;
}
