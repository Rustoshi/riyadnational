import { getBaseTemplate, EmailTemplateProps } from './base';

export interface AccountApprovalEmailProps extends EmailTemplateProps {
    userName: string;
    loginUrl: string;
}

export function getAccountApprovalEmailTemplate(props: AccountApprovalEmailProps): string {
    const { userName, loginUrl } = props;

    const content = `
    <div class="content">
      <h2>Account Approved! ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Good news! Your account application has been reviewed and passed our compliance checks.
        Your account is now fully active and ready to use.
      </p>

      <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px;">What's Next?</h3>
      <p>You can now login to your dashboard to:</p>
      <ul style="color: #475569; padding-left: 20px;">
        <li>View your account details</li>
        <li>Make deposits and transfers</li>
        <li>Access all banking features</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" class="button">Login to Dashboard</a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px;">
        <strong>Need Assistance?</strong><br>
        If you have any trouble accessing your account, please reply to this email or contact our support team.
      </p>

      <p style="margin-top: 24px;">
        Best Regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

    return getBaseTemplate(content, props);
}

export function getAccountApprovalEmailSubject(companyName: string): string {
    return `Account Approved - Welcome to ${companyName}!`;
}
