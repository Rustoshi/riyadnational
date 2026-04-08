// Base template
export { getBaseTemplate, baseStyles } from './base';
export type { EmailTemplateProps } from './base';

// Welcome email
export { getWelcomeEmailTemplate, getWelcomeEmailSubject } from './welcome';
export type { WelcomeEmailProps } from './welcome';

// Password reset emails
export {
  getPasswordResetEmailTemplate,
  getPasswordResetEmailSubject,
  getPasswordResetSuccessEmailTemplate,
  getPasswordResetSuccessEmailSubject,
} from './passwordReset';
export type { PasswordResetEmailProps, PasswordResetSuccessEmailProps } from './passwordReset';

// KYC emails
export {
  getKycSubmissionEmailTemplate,
  getKycSubmissionEmailSubject,
  getKycApprovalEmailTemplate,
  getKycApprovalEmailSubject,
  getKycRejectionEmailTemplate,
  getKycRejectionEmailSubject,
} from './kyc';
export type {
  KycSubmissionEmailProps,
  KycApprovalEmailProps,
  KycRejectionEmailProps,
} from './kyc';

// Transaction emails
export {
  getDepositEmailTemplate,
  getDepositEmailSubject,
  getWithdrawalEmailTemplate,
  getWithdrawalEmailSubject,
  getCreditAlertEmailTemplate,
  getCreditAlertEmailSubject,
  getDebitAlertEmailTemplate,
  getDebitAlertEmailSubject,
} from './transaction';
export type {
  DepositEmailProps,
  WithdrawalEmailProps,
  CreditAlertEmailProps,
  DebitAlertEmailProps,
} from './transaction';

// Account approval email
export {
  getAccountApprovalEmailTemplate,
  getAccountApprovalEmailSubject,
} from './accountApproval';
export type { AccountApprovalEmailProps } from './accountApproval';

// Registration received email
export {
  getRegistrationReceivedEmailTemplate,
  getRegistrationReceivedEmailSubject,
} from './registrationReceived';
export type { RegistrationReceivedEmailProps } from './registrationReceived';

