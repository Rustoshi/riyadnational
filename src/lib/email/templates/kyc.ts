import { getBaseTemplate, EmailTemplateProps } from './base';

// KYC Submission Email
export interface KycSubmissionEmailProps extends EmailTemplateProps {
  userName: string;
  documentType: string;
  submittedAt: string;
}

export function getKycSubmissionEmailTemplate(props: KycSubmissionEmailProps): string {
  const { userName, documentType, submittedAt } = props;

  const content = `
    <div class="content">
      <h2>KYC Documents Submitted 📄</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for submitting your KYC (Know Your Customer) documents. We have received 
        your verification request and our team is reviewing your documents.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Document Type</span>
          <span class="info-value">${documentType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted On</span>
          <span class="info-value">${submittedAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="warning-badge">Under Review</span>
        </div>
      </div>

      <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px;">What Happens Next?</h3>
      <ul style="color: #475569; padding-left: 20px;">
        <li>Our verification team will review your documents within 24-48 hours</li>
        <li>You'll receive an email notification once the review is complete</li>
        <li>If additional information is needed, we'll reach out to you</li>
      </ul>

      <div class="info-box" style="background-color: #DBEAFE;">
        <p style="margin: 0; color: #1E40AF; font-size: 14px;">
          <strong>💡 Tip:</strong> Make sure your documents are clear and all information 
          is readable to speed up the verification process.
        </p>
      </div>

      <p style="margin-top: 24px;">
        Thank you for your patience,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getKycSubmissionEmailSubject(companyName: string): string {
  return `KYC Documents Received - ${companyName}`;
}

// KYC Approval Email
export interface KycApprovalEmailProps extends EmailTemplateProps {
  userName: string;
  approvedAt: string;
  dashboardUrl: string;
}

export function getKycApprovalEmailTemplate(props: KycApprovalEmailProps): string {
  const { userName, approvedAt, dashboardUrl } = props;

  const content = `
    <div class="content">
      <h2>KYC Verification Approved! ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Great news! Your KYC verification has been successfully approved. You now have 
        full access to all ${props.companyName} features and services.
      </p>

      <div class="info-box" style="background-color: #DCFCE7;">
        <div style="text-align: center;">
          <span style="font-size: 48px;">🎉</span>
          <h3 style="color: #166534; margin: 8px 0;">Verification Complete</h3>
          <p style="color: #166534; margin: 0; font-size: 14px;">Approved on ${approvedAt}</p>
        </div>
      </div>

      <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px;">What You Can Do Now</h3>
      <ul style="color: #475569; padding-left: 20px;">
        <li>Make deposits and withdrawals without restrictions</li>
        <li>Send and receive transfers</li>
        <li>Apply for loans and credit cards</li>
        <li>Access premium features</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>

      <p style="margin-top: 24px;">
        Thank you for banking with us!<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getKycApprovalEmailSubject(companyName: string): string {
  return `🎉 KYC Approved - Welcome to ${companyName}!`;
}

// KYC Rejection Email
export interface KycRejectionEmailProps extends EmailTemplateProps {
  userName: string;
  rejectionReason: string;
  rejectedAt: string;
  resubmitUrl: string;
}

export function getKycRejectionEmailTemplate(props: KycRejectionEmailProps): string {
  const { userName, rejectionReason, rejectedAt, resubmitUrl } = props;

  const content = `
    <div class="content">
      <h2>KYC Verification Update ⚠️</h2>
      <p>Dear ${userName},</p>
      <p>
        We regret to inform you that your KYC verification could not be approved at this time. 
        Please review the details below and resubmit your documents.
      </p>

      <div class="info-box" style="background-color: #FEE2E2;">
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="error-badge">Rejected</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${rejectedAt}</span>
        </div>
      </div>

      <div class="info-box">
        <p style="margin: 0 0 8px 0; color: #0F172A; font-weight: 600;">Reason for Rejection:</p>
        <p style="margin: 0; color: #DC2626;">${rejectionReason}</p>
      </div>

      <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px;">How to Resubmit</h3>
      <ol style="color: #475569; padding-left: 20px;">
        <li>Review the rejection reason above</li>
        <li>Prepare new documents that address the issues</li>
        <li>Ensure all documents are clear and readable</li>
        <li>Submit your documents again through your dashboard</li>
      </ol>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resubmitUrl}" class="button">Resubmit Documents</a>
      </div>

      <p style="font-size: 14px; color: #475569;">
        If you have any questions or need assistance, please don't hesitate to contact 
        our support team.
      </p>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, props);
}

export function getKycRejectionEmailSubject(companyName: string): string {
  return `KYC Verification Update - Action Required - ${companyName}`;
}
