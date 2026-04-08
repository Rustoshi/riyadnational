import { getBaseTemplate, EmailTemplateProps } from './base';

// Deposit/Credit Transaction Email
export interface DepositEmailProps extends EmailTemplateProps {
  userName: string;
  amount: string;
  currency?: string;
  reference: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  newBalance?: string;
  transactionDate: string;
  adminNote?: string;
  dashboardUrl: string;
}

export function getDepositEmailTemplate(props: DepositEmailProps): string {
  const {
    userName,
    amount,
    currency = 'USD',
    reference,
    paymentMethod,
    status,
    newBalance,
    transactionDate,
    adminNote,
    dashboardUrl,
  } = props;

  const statusConfig = {
    pending: {
      title: 'Deposit Request Received 📥',
      badge: '<span class="warning-badge">Pending</span>',
      message: 'Your deposit request has been received and is pending approval.',
      color: '#F59E0B',
    },
    approved: {
      title: 'Deposit Approved! ✅',
      badge: '<span class="success-badge">Approved</span>',
      message: 'Great news! Your deposit has been approved and credited to your account.',
      color: '#22C55E',
    },
    rejected: {
      title: 'Deposit Request Update ❌',
      badge: '<span class="error-badge">Rejected</span>',
      message: 'Unfortunately, your deposit request could not be processed.',
      color: '#DC2626',
    },
  };

  const config = statusConfig[status];

  const content = `
    <div class="content">
      <h2>${config.title}</h2>
      <p>Dear ${userName},</p>
      <p>${config.message}</p>

      <div style="text-align: center; margin: 24px 0;">
        <p class="amount credit">+${currency} ${amount}</p>
        <p style="color: #475569; margin: 0;">Deposit Amount</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Reference</span>
          <span class="info-value">${reference}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">${paymentMethod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${transactionDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          ${config.badge}
        </div>
        ${newBalance ? `
        <div class="info-row">
          <span class="info-label">New Balance</span>
          <span class="info-value" style="color: #22C55E; font-weight: 700;">${currency} ${newBalance}</span>
        </div>
        ` : ''}
      </div>

      ${adminNote ? `
      <div class="info-box" style="background-color: ${status === 'rejected' ? '#FEE2E2' : '#F7F9FC'};">
        <p style="margin: 0 0 8px 0; color: #0F172A; font-weight: 600;">Note:</p>
        <p style="margin: 0; color: ${status === 'rejected' ? '#DC2626' : '#475569'};">${adminNote}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">View Transaction</a>
      </div>

      <p style="font-size: 14px; color: #475569;">
        If you have any questions about this transaction, please contact our support team.
      </p>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getDepositEmailSubject(companyName: string, status: string, amount: string): string {
  const subjects = {
    pending: `Deposit Request Received - ${amount} - ${companyName}`,
    approved: `✅ Deposit Approved - ${amount} credited to your account`,
    rejected: `Deposit Request Update - ${companyName}`,
  };
  return subjects[status as keyof typeof subjects] || `Deposit Update - ${companyName}`;
}

// Withdrawal Transaction Email
export interface WithdrawalEmailProps extends EmailTemplateProps {
  userName: string;
  amount: string;
  fee: string;
  netAmount: string;
  currency?: string;
  reference: string;
  paymentMethod: string;
  paymentDetails?: string;
  status: 'pending' | 'approved' | 'rejected';
  newBalance?: string;
  transactionDate: string;
  adminNote?: string;
  dashboardUrl: string;
}

export function getWithdrawalEmailTemplate(props: WithdrawalEmailProps): string {
  const {
    userName,
    amount,
    fee,
    netAmount,
    currency = 'USD',
    reference,
    paymentMethod,
    paymentDetails,
    status,
    newBalance,
    transactionDate,
    adminNote,
    dashboardUrl,
  } = props;

  const statusConfig = {
    pending: {
      title: 'Withdrawal Request Received 📤',
      badge: '<span class="warning-badge">Processing</span>',
      message: 'Your withdrawal request has been received and is being processed.',
      color: '#F59E0B',
    },
    approved: {
      title: 'Withdrawal Approved! ✅',
      badge: '<span class="success-badge">Approved</span>',
      message: 'Your withdrawal has been approved and is being sent to your designated account.',
      color: '#22C55E',
    },
    rejected: {
      title: 'Withdrawal Request Update ❌',
      badge: '<span class="error-badge">Rejected</span>',
      message: 'Your withdrawal request could not be processed. The amount has been refunded to your account.',
      color: '#DC2626',
    },
  };

  const config = statusConfig[status];

  const content = `
    <div class="content">
      <h2>${config.title}</h2>
      <p>Dear ${userName},</p>
      <p>${config.message}</p>

      <div style="text-align: center; margin: 24px 0;">
        <p class="amount debit">-${currency} ${amount}</p>
        <p style="color: #475569; margin: 0;">Withdrawal Amount</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Reference</span>
          <span class="info-value">${reference}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">${currency} ${amount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fee</span>
          <span class="info-value">${currency} ${fee}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Net Amount</span>
          <span class="info-value" style="font-weight: 700;">${currency} ${netAmount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">${paymentMethod}</span>
        </div>
        ${paymentDetails ? `
        <div class="info-row">
          <span class="info-label">Destination</span>
          <span class="info-value">${paymentDetails}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${transactionDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          ${config.badge}
        </div>
        ${newBalance ? `
        <div class="info-row">
          <span class="info-label">Remaining Balance</span>
          <span class="info-value">${currency} ${newBalance}</span>
        </div>
        ` : ''}
      </div>

      ${adminNote ? `
      <div class="info-box" style="background-color: ${status === 'rejected' ? '#FEE2E2' : '#F7F9FC'};">
        <p style="margin: 0 0 8px 0; color: #0F172A; font-weight: 600;">Note:</p>
        <p style="margin: 0; color: ${status === 'rejected' ? '#DC2626' : '#475569'};">${adminNote}</p>
      </div>
      ` : ''}

      ${status === 'approved' ? `
      <div class="info-box" style="background-color: #DBEAFE;">
        <p style="margin: 0; color: #1E40AF; font-size: 14px;">
          <strong>💡 Note:</strong> Withdrawal processing times vary by payment method. 
          Bank transfers typically take 1-3 business days.
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">View Transaction</a>
      </div>

      <p style="font-size: 14px; color: #475569;">
        If you have any questions about this transaction, please contact our support team.
      </p>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getWithdrawalEmailSubject(companyName: string, status: string, amount: string): string {
  const subjects = {
    pending: `Withdrawal Request Received - ${amount} - ${companyName}`,
    approved: `✅ Withdrawal Approved - ${amount} - ${companyName}`,
    rejected: `Withdrawal Request Update - ${companyName}`,
  };
  return subjects[status as keyof typeof subjects] || `Withdrawal Update - ${companyName}`;
}

// Credit Alert (Admin credited user)
export interface CreditAlertEmailProps extends EmailTemplateProps {
  userName: string;
  amount: string;
  currency?: string;
  description: string;
  newBalance: string;
  transactionDate: string;
  dashboardUrl: string;
}

export function getCreditAlertEmailTemplate(props: CreditAlertEmailProps): string {
  const {
    userName,
    amount,
    currency = 'USD',
    description,
    newBalance,
    transactionDate,
    dashboardUrl,
  } = props;

  const content = `
    <div class="content">
      <h2>Credit Alert 💰</h2>
      <p>Dear ${userName},</p>
      <p>Your account has been credited with the following amount:</p>

      <div style="text-align: center; margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); border-radius: 12px;">
        <p class="amount credit">+${currency} ${amount}</p>
        <p style="color: #166534; margin: 0;">Amount Credited</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Description</span>
          <span class="info-value">${description}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${transactionDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">New Balance</span>
          <span class="info-value" style="color: #22C55E; font-weight: 700;">${currency} ${newBalance}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">View Account</a>
      </div>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getCreditAlertEmailSubject(companyName: string, amount: string): string {
  return `💰 Credit Alert - ${amount} credited to your ${companyName} account`;
}

// Debit Alert (Admin debited user)
export interface DebitAlertEmailProps extends EmailTemplateProps {
  userName: string;
  amount: string;
  currency?: string;
  description: string;
  newBalance: string;
  transactionDate: string;
  dashboardUrl: string;
}

export function getDebitAlertEmailTemplate(props: DebitAlertEmailProps): string {
  const {
    userName,
    amount,
    currency = 'USD',
    description,
    newBalance,
    transactionDate,
    dashboardUrl,
  } = props;

  const content = `
    <div class="content">
      <h2>Debit Alert 📤</h2>
      <p>Dear ${userName},</p>
      <p>Your account has been debited with the following amount:</p>

      <div style="text-align: center; margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 12px;">
        <p class="amount debit">-${currency} ${amount}</p>
        <p style="color: #991B1B; margin: 0;">Amount Debited</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Description</span>
          <span class="info-value">${description}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${transactionDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Remaining Balance</span>
          <span class="info-value">${currency} ${newBalance}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">View Account</a>
      </div>

      <p style="font-size: 14px; color: #475569;">
        If you did not authorize this transaction, please contact our support team immediately.
      </p>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getDebitAlertEmailSubject(companyName: string, amount: string): string {
  return `📤 Debit Alert - ${amount} debited from your ${companyName} account`;
}
