import { z } from 'zod';
import {
  UserStatus,
  KycStatus,
  AccountType,
  AdminRole,
  AdminStatus,
  TransactionType,
  TransactionStatus,
  DepositStatus,
  WithdrawalStatus,
  TransferType,
  TransferStatus,
  CardType,
  CardStatus,
  PlanStatus,
  UserPlanStatus,
  DocumentType,
  LoanStatus,
  NotificationType,
  PaymentMethodType,
  PaymentMethodStatus,
  FeeType,
  SettingsCategory,
} from '@/types';

// Common validations
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Auth validations
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string().optional(),
  // username removed
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  accountType: z.nativeEnum(AccountType).default(AccountType.SAVINGS),
  pin: z.string().length(4, 'PIN must be 4 digits').regex(/^[0-9]+$/, 'PIN must contain only numbers'),
  referralCode: z.string().optional(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const verify2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

// User validations
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const changePinSchema = z.object({
  currentPin: z.string().length(4, 'PIN must be 4 digits').optional(),
  newPin: z.string().length(4, 'PIN must be 4 digits'),
});

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

// Transaction validations
export const createDepositSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: objectIdSchema,
  proofImage: z.string().optional(),
});

export const createWithdrawalSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: objectIdSchema,
  paymentDetails: z.record(z.string(), z.unknown()).optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

export const internalTransferSchema = z.object({
  recipientAccountNumber: z.string().min(1, 'Recipient account number is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

export const localTransferSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankCode: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

export const internationalTransferSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  country: z.string().min(1, 'Country is required'),
  swiftCode: z.string().optional(),
  routingNumber: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

export const verifyCodesSchema = z.object({
  transferId: objectIdSchema,
  imfCode: z.string().optional(),
  cotCode: z.string().optional(),
});

// Card validations
export const applyCardSchema = z.object({
  cardType: z.nativeEnum(CardType),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
});

export const cardPinSchema = z.object({
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

// Plan validations
export const subscribePlanSchema = z.object({
  planId: objectIdSchema,
  amount: z.number().positive('Amount must be positive'),
});

// KYC validations
export const submitKycSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(1, 'Document number is required'),
  frontImage: z.string().min(1, 'Front image is required'),
  backImage: z.string().optional(),
  selfieImage: z.string().min(1, 'Selfie image is required'),
});

// Loan validations
export const applyLoanSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  durationMonths: z.number().int().min(1).max(60),
  purpose: z.string().min(1, 'Purpose is required'),
});

// Admin validations
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'), // Simpler validation for admin-created users
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional().default('USD'),
  accountType: z.nativeEnum(AccountType).optional().default(AccountType.SAVINGS),
  balance: z.number().optional().default(0),
  bitcoinBalance: z.number().optional().default(0),
  pin: z.string().optional(), // 4-digit PIN
  status: z.nativeEnum(UserStatus).optional().default(UserStatus.INACTIVE),
  withdrawalFee: z.number().optional().default(0),
  createdAt: z.string().optional(), // For backdating account age
  sendNotificationEmail: z.boolean().optional().default(false),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  kycStatus: z.nativeEnum(KycStatus).optional(),
  balance: z.number().optional(),
  bonus: z.number().optional(),
  tradingBalance: z.number().optional(),
  dailyTransferLimit: z.number().optional(),
  dailyWithdrawalLimit: z.number().optional(),
});

export const topupUserSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['balance', 'bonus', 'trading']).default('balance'),
  description: z.string().optional(),
});

export const deductUserSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['balance', 'bonus', 'trading']).default('balance'),
  description: z.string().optional(),
});

export const updateUserCodesSchema = z.object({
  imfCode: z.string().optional(),
  cotCode: z.string().optional(),
});

export const updateUserLimitsSchema = z.object({
  dailyTransferLimit: z.number().positive().optional(),
  dailyWithdrawalLimit: z.number().positive().optional(),
});

export const processDepositSchema = z.object({
  status: z.enum([DepositStatus.APPROVED, DepositStatus.REJECTED]),
  adminNote: z.string().optional(),
});

export const processWithdrawalSchema = z.object({
  status: z.enum([WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED]),
  adminNote: z.string().optional(),
});

export const processTransferSchema = z.object({
  status: z.enum([TransferStatus.COMPLETED, TransferStatus.FAILED, TransferStatus.CANCELLED]),
  adminNote: z.string().optional(),
});

export const processCardSchema = z.object({
  status: z.enum([CardStatus.ACTIVE, CardStatus.BLOCKED]),
  adminNote: z.string().optional(),
});

export const cardTopupSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

export const cardDeductSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  minAmount: z.number().positive('Minimum amount must be positive'),
  maxAmount: z.number().positive('Maximum amount must be positive'),
  returnPercentage: z.number().positive('Return percentage must be positive'),
  durationDays: z.number().int().positive('Duration must be positive'),
  features: z.array(z.string()).default([]),
  status: z.nativeEnum(PlanStatus).default(PlanStatus.ACTIVE),
});

export const updatePlanSchema = createPlanSchema.partial();

export const processKycSchema = z.object({
  status: z.enum([KycStatus.APPROVED, KycStatus.REJECTED]),
  rejectionReason: z.string().optional(),
});

export const processLoanSchema = z.object({
  status: z.enum([LoanStatus.APPROVED, LoanStatus.REJECTED]),
  interestRate: z.number().positive().optional(),
  adminNote: z.string().optional(),
});

export const disburseLoanSchema = z.object({
  loanId: objectIdSchema,
});

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(PaymentMethodType),
  details: z.record(z.string(), z.unknown()),
  instructions: z.string().optional(),
  minAmount: z.number().positive().default(1),
  maxAmount: z.number().positive().default(1000000),
  fee: z.number().min(0).default(0),
  feeType: z.nativeEnum(FeeType).default(FeeType.FIXED),
  status: z.nativeEnum(PaymentMethodStatus).default(PaymentMethodStatus.ACTIVE),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

export const createAdminSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(AdminRole).default(AdminRole.ADMIN),
  permissions: z.array(z.string()).default([]),
});

export const updateAdminSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(2).optional(),
  role: z.nativeEnum(AdminRole).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.nativeEnum(AdminStatus).optional(),
});

export const updateSettingsAdminSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.unknown(),
  category: z.nativeEnum(SettingsCategory).optional(),
});

export const bulkUpdateSettingsSchema = z.array(updateSettingsAdminSchema);

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePinInput = z.infer<typeof changePinSchema>;
export type CreateDepositInput = z.infer<typeof createDepositSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type InternalTransferInput = z.infer<typeof internalTransferSchema>;
export type LocalTransferInput = z.infer<typeof localTransferSchema>;
export type InternationalTransferInput = z.infer<typeof internationalTransferSchema>;
export type ApplyCardInput = z.infer<typeof applyCardSchema>;
export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;
export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TopupUserInput = z.infer<typeof topupUserSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
