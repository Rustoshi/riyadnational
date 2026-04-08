/**
 * Base email template wrapper
 * Provides consistent styling for all email templates
 */

export interface EmailTemplateProps {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export const baseStyles = {
  primaryColor: '#2563EB',
  backgroundColor: '#F7F9FC',
  textColor: '#0F172A',
  secondaryTextColor: '#475569',
  borderColor: '#E2E8F0',
  successColor: '#22C55E',
  errorColor: '#DC2626',
  warningColor: '#F59E0B',
};

export function getBaseTemplate(
  content: string,
  props: EmailTemplateProps
): string {
  const {
    companyName,
    companyEmail = 'support@example.com',
    companyPhone = '+1 (800) 123-4567',
    companyAddress = '123 Financial District, New York, NY',
    primaryColor = baseStyles.primaryColor,
  } = props;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${baseStyles.backgroundColor};
      color: ${baseStyles.textColor};
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, #4F46E5 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #FFFFFF;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header .logo {
      font-size: 28px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .content {
      padding: 32px;
    }
    .content h2 {
      color: ${baseStyles.textColor};
      font-size: 20px;
      margin: 0 0 16px 0;
    }
    .content p {
      color: ${baseStyles.secondaryTextColor};
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${primaryColor};
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .info-box {
      background-color: ${baseStyles.backgroundColor};
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid ${baseStyles.borderColor};
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: ${baseStyles.secondaryTextColor};
      font-size: 14px;
    }
    .info-value {
      color: ${baseStyles.textColor};
      font-weight: 600;
      font-size: 14px;
    }
    .success-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #DCFCE7;
      color: ${baseStyles.successColor};
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .error-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #FEE2E2;
      color: ${baseStyles.errorColor};
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .warning-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #FEF3C7;
      color: ${baseStyles.warningColor};
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      padding: 24px 32px;
      background-color: ${baseStyles.backgroundColor};
      text-align: center;
      border-top: 1px solid ${baseStyles.borderColor};
    }
    .footer p {
      color: ${baseStyles.secondaryTextColor};
      font-size: 12px;
      margin: 4px 0;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: ${baseStyles.borderColor};
      margin: 24px 0;
    }
    .amount {
      font-size: 32px;
      font-weight: 700;
      color: ${baseStyles.textColor};
    }
    .amount.credit {
      color: ${baseStyles.successColor};
    }
    .amount.debit {
      color: ${baseStyles.errorColor};
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px 10px;
      }
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏦 ${companyName}</div>
      </div>
      ${content}
      <div class="footer">
        <p><strong>${companyName}</strong></p>
        <p>${companyAddress}</p>
        <p>📞 ${companyPhone} | ✉️ <a href="mailto:${companyEmail}">${companyEmail}</a></p>
        <div style="margin-top: 16px;">
          <p>This email was sent by ${companyName}. Please do not reply directly to this email.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
