import { getBaseTemplate, EmailTemplateProps } from './base';

export interface WelcomeEmailProps extends EmailTemplateProps {
  userName: string;
  userEmail: string;
  accountNumber: string;
  loginUrl: string;
}

export function getWelcomeEmailTemplate(props: WelcomeEmailProps): string {
  const { userName, userEmail, accountNumber, loginUrl } = props;

  const content = `
    <div class="content">
      <h2>Welcome to ${props.companyName}! 🎉</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for choosing ${props.companyName} for your banking needs. Your account has been 
        successfully created and is ready to use.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Account Holder</span>
          <span class="info-value">${userName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${userEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Number</span>
          <span class="info-value">${accountNumber}</span>
        </div>
      </div>

      <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px;">Getting Started</h3>
      <p>Here are a few things you can do to get started:</p>
      <ul style="color: #475569; padding-left: 20px;">
        <li>Complete your KYC verification to unlock all features</li>
        <li>Set up your security preferences</li>
        <li>Make your first deposit</li>
        <li>Explore our services and features</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" class="button">Access Your Account</a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px;">
        <strong>Need Help?</strong><br>
        Our support team is available 24/7 to assist you. Feel free to reach out if you have 
        any questions or need assistance.
      </p>

      <p style="margin-top: 24px;">
        Welcome aboard!<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getWelcomeEmailSubject(companyName: string): string {
  return `Welcome to ${companyName} - Your Account is Ready! 🎉`;
}
