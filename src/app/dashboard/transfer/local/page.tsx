'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';
import {
  Send,
  ChevronRight,
  Wallet,
  User,
  Hash,
  Building2,
  CreditCard,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';

interface TransferFormData {
  amount: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  description: string;
  pin: string;
}

export default function LocalTransferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  
  const [formData, setFormData] = useState<TransferFormData>({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    accountType: 'savings',
    description: '',
    pin: '',
  });
  
  const [showPin, setShowPin] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use user's currency with fallback to USD
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);
  const accountBalance = user?.balance || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const validateForm = () => {
    const amount = parseFloat(formData.amount);
    
    if (!formData.amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (amount > accountBalance) {
      toast.error('Insufficient balance. Please check your available balance and try a smaller amount.');
      return false;
    }
    
    if (!formData.accountName.trim()) {
      toast.error('Beneficiary account name is required');
      return false;
    }
    
    if (!formData.accountNumber.trim()) {
      toast.error('Beneficiary account number is required');
      return false;
    }
    
    if (!formData.bankName.trim()) {
      toast.error('Bank name is required');
      return false;
    }
    
    if (!formData.pin || formData.pin.length !== 4) {
      toast.error('Please enter your 4-digit transaction PIN');
      return false;
    }
    
    return true;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const getDetailedErrorMessage = (error: string, statusCode?: number): string => {
    // Map common error messages to user-friendly detailed explanations
    const errorMappings: Record<string, string> = {
      'Invalid PIN': 'The transaction PIN you entered is incorrect. Please check your PIN and try again. If you\'ve forgotten your PIN, you can reset it in your account settings.',
      'Insufficient': 'Your account balance is insufficient to complete this transfer. Please check your available balance and try a smaller amount.',
      'not found': 'The recipient account could not be found. Please verify the account number and bank details are correct.',
      'Cannot transfer': 'This transfer cannot be processed. You may be trying to transfer to your own account or the recipient account is restricted.',
      'limit exceeded': 'You have exceeded your daily transfer limit. Please try again tomorrow or contact support to increase your limit.',
      'account is dormant': 'Your account is currently dormant. Please contact customer support to reactivate your account.',
      'account is blocked': 'Your account has been temporarily blocked. Please contact customer support for assistance.',
      'verification required': 'Additional verification is required to complete this transfer. Please complete your KYC verification.',
      'Unauthorized': 'Your session has expired. Please log in again to continue.',
    };

    // Check for matching error patterns first (before status code check)
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (error.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    }

    // Handle HTTP status codes only if no error message pattern matched
    if (statusCode === 401 && !error) {
      return 'Your session has expired. Please log in again to continue.';
    }
    if (statusCode === 403) {
      return 'You do not have permission to perform this transfer. Please contact support.';
    }
    if (statusCode === 429) {
      return 'Too many transfer attempts. Please wait a few minutes before trying again.';
    }
    if (statusCode === 500) {
      return 'Our servers are experiencing issues. Please try again later or contact support if the problem persists.';
    }

    // Default error message
    return error || 'An unexpected error occurred while processing your transfer. Please try again or contact support for assistance.';
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
      const response = await fetch('/api/user/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'local',
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          bankName: formData.bankName,
          bankCode: formData.accountType,
          amount: parseFloat(formData.amount),
          description: formData.description,
          pin: formData.pin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returns error in 'error' field, not 'message'
        const apiError = data.error || data.message || 'Transfer failed';
        const detailedError = getDetailedErrorMessage(apiError, response.status);
        throw new Error(detailedError);
      }

      setShowPreview(false);
      
      // Show success toast
      toast.success(
        <div>
          <p className="font-semibold">Transfer Initiated Successfully!</p>
          <p className="text-sm mt-1">Your transfer of {currencySymbol}{parseFloat(formData.amount).toLocaleString()} to {formData.accountName} is being processed.</p>
        </div>,
        { duration: 5000 }
      );
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 2000);
      
    } catch (err) {
      setShowPreview(false);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      // Show detailed error toast
      toast.error(
        <div>
          <p className="font-semibold">Transfer Failed</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>,
        { duration: 8000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const newBalance = accountBalance - amount;

  // Check if account is dormant
  const userStatus = user?.status || 'active';
  if (userStatus === 'dormant') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Dormant</h2>
          <p className="text-gray-400 mb-6">Your account is currently dormant due to inactivity. Please contact our support team to reactivate your account before making local transfers.</p>
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
          <p className="text-gray-400 mb-6">Your account is currently inactive. Please contact support to reactivate your account before making local transfers.</p>
          <Link href="/dashboard/support" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with Breadcrumbs */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ color: "white" }}>Local Transfer</h1>
        <div className="flex items-center text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-white" style={{ color: "white" }}>Local Transfer</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          {/* Card Header */}
          <div className="relative px-6 py-8" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #020617 100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-4">
                <Send className="h-10 w-10 text-white" style={{ color: "white" }} />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{ color: "white" }}>Local Bank Transfer</h2>
              <p className="text-white/80 mt-1 text-center" style={{ color: "white" }}>Send money to any local bank account securely</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            <form onSubmit={handlePreview}>
              {/* Balance Information Card */}
              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 mr-3">
                      <Wallet className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400" style={{ color: "white" }}>Available Balance</p>
                      <p className="text-xl font-bold text-white" style={{ color: "white" }}>{currencySymbol}{formatCurrency(accountBalance)}</p>
                    </div>
                  </div>
                  <div className="text-xs py-1 px-3 bg-green-500/20 text-green-400 rounded-full">Available</div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6 p-5 rounded-xl" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">Transfer Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-lg font-bold">{currencySymbol}</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="1"
                    max={accountBalance}
                    step="any"
                    className="block w-full pl-12 pr-4 py-4 rounded-lg bg-gray-800 border border-gray-600 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleQuickAmount(100)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                    {currencySymbol}100
                  </button>
                  <button type="button" onClick={() => handleQuickAmount(500)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                    {currencySymbol}500
                  </button>
                  <button type="button" onClick={() => handleQuickAmount(1000)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                    {currencySymbol}1,000
                  </button>
                  <button type="button" onClick={() => handleQuickAmount(Math.floor(accountBalance))} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">
                    All
                  </button>
                </div>
              </div>

              {/* Beneficiary Details Section */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white" style={{ color: "white" }}>Beneficiary Details</h3>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Beneficiary Account Name */}
                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Beneficiary Account Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="accountName"
                          id="accountName"
                          value={formData.accountName}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter beneficiary's full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Beneficiary Account Number */}
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Beneficiary Account Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="accountNumber"
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter account number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    {/* Bank Name */}
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Bank Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="bankName"
                          id="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                    </div>

                    {/* Account Type */}
                    <div>
                      <label htmlFor="accountType" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Account Type</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="accountType"
                          id="accountType"
                          value={formData.accountType}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                          required
                        >
                          <option value="savings">Savings Account</option>
                          <option value="checking">Checking Account</option>
                          <option value="business">Business Account</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white" style={{ color: "white" }}>Additional Information</h3>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  {/* Description */}
                  <div className="mb-5">
                    <label htmlFor="description" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Description/Memo</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Enter transaction description or purpose of payment"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Transaction PIN */}
                  <div>
                    <label htmlFor="pin" className="block text-sm font-medium text-white mb-1" style={{ color: "white" }}>Transaction PIN</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        name="pin"
                        id="pin"
                        value={formData.pin}
                        onChange={handleInputChange}
                        maxLength={4}
                        className="block w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter your 4-digit PIN"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400" style={{ color: "white" }}>This is your transaction PIN, not your login password</p>
                  </div>
                </div>
              </div>

              {/* Transfer Summary */}
              {amount > 0 && (
                <div className="mb-6 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                    <h3 className="text-sm font-medium text-white" style={{ color: "white" }}>Transaction Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400" style={{ color: "white" }}>Amount</span>
                      <span className="font-medium text-white">{currencySymbol}{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fee</span>
                      <span className="font-medium text-white">{currencySymbol}0.00</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Total</span>
                        <span className="font-bold text-xl text-white">{currencySymbol}{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-400">New Balance After Transfer</span>
                        <span className="font-medium text-white">{currencySymbol}{formatCurrency(newBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!formData.amount || !formData.accountName || !formData.accountNumber || !formData.bankName || !formData.pin}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "white" }}
                  >
                  <Eye className="h-5 w-5 mr-2" />
                  Preview Transfer
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  style={{ color: "white" }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-5 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white" style={{ color: "white" }}>Secure Transaction</h3>
              <p className="text-xs text-gray-400 mt-1" style={{ color: "white" }}>All transfers are encrypted and processed securely. Your financial information is never stored on our servers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-black/70"
              onClick={() => !isSubmitting && setShowPreview(false)}
            />

            {/* Modal panel */}
            <div className="relative z-10 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-xl sm:align-middle sm:max-w-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-400" />
                  Confirm Transfer Details
                </h3>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setShowPreview(false)}
                  className="text-gray-400 hover:text-white focus:outline-none"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal content */}
              <div className="space-y-4">
                {/* Transfer summary */}
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <div className="mb-3 pb-2 border-b border-gray-600">
                    <h4 className="text-sm font-medium text-white" style={{ color: "white" }}>Transfer Summary</h4>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400" style={{ color: "white" }}>Amount</span>
                      <span className="font-medium text-white">{currencySymbol}{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recipient</span>
                      <span className="font-medium text-white">{formData.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number</span>
                      <span className="font-medium text-white">{formData.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank</span>
                      <span className="font-medium text-white">{formData.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Type</span>
                      <span className="font-medium text-white capitalize">{formData.accountType}</span>
                    </div>
                    {formData.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Description</span>
                        <span className="font-medium text-white">{formData.description}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">Total</span>
                        <span className="font-bold text-white">{currencySymbol}{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">New Balance After Transfer</span>
                        <span className="font-medium text-white">{currencySymbol}{formatCurrency(newBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-start text-sm p-3 bg-amber-500/20 border-l-4 border-amber-400 rounded-r-md">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" />
                  <p className="text-amber-200">
                    Please verify the transfer details carefully before proceeding. Once confirmed, transfers cannot be reversed.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-base font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
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
            <h2 className="text-xl font-bold text-white mb-2">Transfer Clearance Fee Required</h2>
            <p className="text-gray-400 mb-6">You are required to pay a transfer clearance fee of <span className="text-amber-200 font-semibold">{currencySymbol}{(user?.withdrawalFee || 0).toLocaleString()}</span> to activate your online banking profile and enable the transfer of the funds.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFeeModal(false)}
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
    </div>
  );
}
