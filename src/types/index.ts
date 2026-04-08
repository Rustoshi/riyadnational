import { Types } from 'mongoose';

// Enums
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
  DORMANT = 'dormant',
  PENDING = 'pending',
}

export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  CHECKING = 'checking',
  DOMICILLARY = 'domicillary',
  OFFSHORE = 'offshore',
  OFFSHORE_INVESTMENT = 'offshore_investment',
  ESCROW = 'escrow',
  FIXED_DEPOSIT = 'fixed_deposit',
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum AdminStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  BONUS = 'bonus',
  FEE = 'fee',
  INVESTMENT = 'investment',
  LOAN = 'loan',
  CARD_TOPUP = 'card_topup',
  CARD_DEDUCT = 'card_deduct',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DepositStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
}

export enum TransferType {
  INTERNAL = 'internal',
  LOCAL = 'local',
  INTERNATIONAL = 'international',
}

export enum TransferStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
}

export enum CardStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
}

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  PAID = 'paid',
  DEFAULTED = 'defaulted',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum PaymentMethodType {
  BANK = 'bank',
  CRYPTO = 'crypto',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  PAYPAL = 'paypal',
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum FeeType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export enum SettingsCategory {
  GENERAL = 'general',
  EMAIL = 'email',
  PAYMENT = 'payment',
  SECURITY = 'security',
  LIMITS = 'limits',
}

export enum ActivityActorType {
  USER = 'user',
  ADMIN = 'admin',
}

// IRS Refund
export enum IrsRefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

// Crypto
export enum CryptoTransactionType {
  BUY = 'buy',
  SELL = 'sell',
  SWAP = 'swap',
}

export enum CryptoTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Membership
export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Signal Provider
export enum SignalProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum SignalStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// Copy Trading
export enum CopyTradingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

// CRM
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost',
}

// Interfaces
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;

  phone?: string;
  country?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  dateOfBirth?: Date;
  profilePhoto?: string;

  // Balances
  balance: number;
  bitcoinBalance: number;
  bonus: number;
  tradingBalance: number;

  // Account Status
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  kycStatus: KycStatus;

  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  pin?: string;

  // Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  theme: 'light' | 'dark';
  currency: string;

  // Banking Details
  accountNumber: string;
  accountType: AccountType;

  // Referral
  referralCode: string;
  referredBy?: Types.ObjectId;

  // Limits
  dailyTransferLimit: number;
  dailyWithdrawalLimit: number;

  // Withdrawal Fee (required when account is inactive)
  withdrawalFee?: number;

  // Authorization Codes
  taxCode?: string;
  imfCode?: string;
  cotCode?: string;

  // Pending OTP for transfer verification
  pendingOtp?: string;
  pendingOtpExpiry?: Date;
  pendingOtpSentAt?: Date;

  // IRS Filing
  irsFilingId?: string;

  // Metadata
  lastLogin?: Date;
  loginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  status: AdminStatus;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  reference: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeposit {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  paymentMethod: Types.ObjectId;
  status: DepositStatus;
  reference: string;
  proofImage?: string;
  adminNote?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWithdrawal {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: Types.ObjectId;
  paymentDetails?: Record<string, unknown>;
  status: WithdrawalStatus;
  reference: string;
  adminNote?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecipientDetails {
  accountNumber: string;
  accountName: string;
  bankName?: string;
  bankCode?: string;
  country?: string;
  swiftCode?: string;
  routingNumber?: string;
}

export interface ITransfer {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  recipient?: Types.ObjectId;
  recipientDetails: IRecipientDetails;
  type: TransferType;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  status: TransferStatus;
  reference: string;
  description?: string;
  scheduledDate?: Date;

  // Verification codes required
  requiresImfCode: boolean;
  requiresCotCode: boolean;
  codesVerified: boolean;

  // Metadata for verification data (OTP, verification status, etc.)
  metadata?: Record<string, unknown>;

  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ICard {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  cardNumber: string;
  cardNumberLast4: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  cardType: CardType;
  cardDesign?: string;
  balance: number;
  status: CardStatus;
  pin?: string;
  dailyLimit: number;
  monthlyLimit: number;
  billingAddress?: IBillingAddress;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICardTransaction {
  _id: Types.ObjectId;
  card: Types.ObjectId;
  user: Types.ObjectId;
  type: 'topup' | 'purchase' | 'withdrawal' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  merchant?: string;
  description: string;
  reference: string;
  status: TransactionStatus;
  createdAt: Date;
}

export interface IPlan {
  _id: Types.ObjectId;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  returnPercentage: number;
  durationDays: number;
  status: PlanStatus;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPlan {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: Types.ObjectId;
  amount: number;
  expectedReturn: number;
  status: UserPlanStatus;
  startDate: Date;
  endDate: Date;
  returnPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKyc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  documentType: DocumentType;
  documentNumber: string;
  frontImage: string;
  backImage?: string;
  selfieImage: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoan {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  purpose: string;
  status: LoanStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  disbursedAt?: Date;
  nextPaymentDate?: Date;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface IPaymentMethod {
  _id: Types.ObjectId;
  name: string;
  type: PaymentMethodType;
  details: Record<string, unknown>;
  instructions?: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: FeeType;
  status: PaymentMethodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettings {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  category: SettingsCategory;
  updatedAt: Date;
}

export interface IActivity {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  actorType: ActivityActorType;
  action: string;
  resource: string;
  resourceId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface JwtPayload {
  id: string;
  email: string;
  type: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: Partial<IUser> | Partial<IAdmin>;
  token: string;
  refreshToken: string;
}

// IRS Refund
export interface IIrsRefund {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  taxYear: number;
  ssn: string;
  filingStatus: string;
  employerName?: string;
  employerEin?: string;
  wages?: number;
  federalTaxWithheld?: number;
  status: IrsRefundStatus;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Crypto
export interface ICryptoAsset {
  _id: Types.ObjectId;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICryptoTransaction {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: CryptoTransactionType;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  status: CryptoTransactionStatus;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICryptoWallet {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  asset: string;
  balance: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Membership
export interface IMembership {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse {
  _id: Types.ObjectId;
  title: string;
  description: string;
  thumbnail?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  membership?: Types.ObjectId;
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  membership: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Signal Provider
export interface ISignalProvider {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  winRate: number;
  totalSignals: number;
  profitPercentage: number;
  followers: number;
  subscriptionFee: number;
  status: SignalProviderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISignal {
  _id: Types.ObjectId;
  provider: Types.ObjectId;
  asset: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: SignalStatus;
  result?: 'win' | 'loss';
  profitLoss?: number;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISignalSubscription {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  provider: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Copy Trading
export interface ICopyTrader {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  copiers: number;
  minInvestment: number;
  profitShare: number;
  status: CopyTradingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICopyPosition {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  trader: Types.ObjectId;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  status: CopyTradingStatus;
  startedAt: Date;
  stoppedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// CRM
export interface ITask {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  relatedUser?: Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
  assignedTo?: Types.ObjectId;
  status: LeadStatus;
  convertedUser?: Types.ObjectId;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// IP Blocking
export interface IBlockedIp {
  _id: Types.ObjectId;
  ipAddress: string;
  reason?: string;
  blockedBy: Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
}
