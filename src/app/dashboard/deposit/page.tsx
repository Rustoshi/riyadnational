'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  PiggyBank,
  Building2,
  Bitcoin,
  CreditCard,
  Wallet,
  Check,
  Shield,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

interface PaymentMethod {
  _id: string;
  name: string;
  type: string;
  details: {
    walletAddress?: string;
    network?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
    [key: string]: unknown;
  };
  instructions?: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: string;
}

// Quick amount options
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function DepositPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  // User's currency
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/user/payment-methods', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        toast.error('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Get icon for payment method type
  const getMethodIcon = (type: string, name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bank')) {
      return <Building2 className="h-5 w-5 text-blue-500" />;
    }
    if (nameLower.includes('bitcoin') || nameLower.includes('crypto') || type === 'crypto') {
      return <Bitcoin className="h-5 w-5 text-amber-500" />;
    }
    if (nameLower.includes('card') || nameLower.includes('credit') || type === 'card') {
      return <CreditCard className="h-5 w-5 text-indigo-500" />;
    }
    if (nameLower.includes('paypal') || type === 'paypal') {
      return <CreditCard className="h-5 w-5 text-blue-600" />;
    }
    return <Wallet className="h-5 w-5 text-green-500" />;
  };

  // Get background color for icon
  const getIconBgColor = (type: string, name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bank')) return 'bg-blue-500/20';
    if (nameLower.includes('bitcoin') || nameLower.includes('crypto') || type === 'crypto') return 'bg-amber-500/20';
    if (nameLower.includes('card') || nameLower.includes('credit') || type === 'card') return 'bg-indigo-500/20';
    if (nameLower.includes('paypal') || type === 'paypal') return 'bg-blue-500/20';
    return 'bg-green-500/20';
  };

  // Validate amount
  const validateAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      setAmount('');
      return;
    }
    setAmount(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedPaymentMethod = paymentMethods.find(m => m._id === selectedMethod);
    if (selectedPaymentMethod) {
      const amountNum = parseFloat(amount);
      if (amountNum < selectedPaymentMethod.minAmount) {
        toast.error(`Minimum deposit amount is ${currencySymbol}${selectedPaymentMethod.minAmount}`);
        return;
      }
      if (amountNum > selectedPaymentMethod.maxAmount) {
        toast.error(`Maximum deposit amount is ${currencySymbol}${selectedPaymentMethod.maxAmount}`);
        return;
      }
    }

    setIsSubmitting(true);

    // Store deposit info in sessionStorage and navigate to payment page
    sessionStorage.setItem('depositAmount', amount);
    sessionStorage.setItem('depositMethodId', selectedMethod);
    
    router.push('/dashboard/deposit/payment');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4" style={{color: "#9ca3af"}}>Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{color: "white"}}>Deposit Funds</h1>
        <div className="flex items-center text-sm" style={{color: "#9ca3af"}}>
          <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span style={{color: "#d1d5db"}}>Deposit</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl shadow-md border border-gray-700 overflow-hidden" style={{backgroundColor: 'rgb(31 41 55)'}}>
          {/* Card Header */}
          <div className="relative px-6 py-8" style={{background: 'linear-gradient(to right, rgb(8 145 178), rgb(6 182 212))'}}>
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-full mb-4" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                <PiggyBank className="h-10 w-10" style={{color: "white"}} />
              </div>
              <h2 className="text-2xl font-bold" style={{color: "white"}}>Fund Your Account</h2>
              <p className="mt-1 text-center" style={{color: "rgba(255,255,255,0.8)"}}>Choose your preferred deposit method and amount</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              {/* Payment Method Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3" style={{color: "#d1d5db"}}>Select Deposit Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <div
                        key={method._id}
                        onClick={() => setSelectedMethod(method._id)}
                        className={`cursor-pointer border rounded-lg p-4 transition-all ${
                          selectedMethod === method._id
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                            : 'border-gray-600 hover:border-blue-400'
                        }`}
                        style={{backgroundColor: selectedMethod === method._id ? 'rgba(8, 145, 178, 0.1)' : 'rgb(55 65 81)'}}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getIconBgColor(method.type, method.name)}`}>
                            {getMethodIcon(method.type, method.name)}
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium" style={{color: "white"}}>{method.name}</h3>
                          </div>
                          <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                            selectedMethod === method._id ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                          }`}>
                            {selectedMethod === method._id && <Check className="h-3 w-3" style={{color: "white"}} />}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-4 rounded-md border-l-4 border-yellow-400" style={{backgroundColor: 'rgba(234, 179, 8, 0.1)'}}>
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                        <p className="text-sm text-yellow-400">
                          No payment methods are enabled at the moment. Please check back later.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-8 p-5 rounded-xl border border-gray-600" style={{backgroundColor: 'rgb(55 65 81)'}}>
                <label className="block text-sm font-medium mb-2" style={{color: "#d1d5db"}}>Deposit Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-lg font-bold" style={{color: "#9ca3af"}}>{currencySymbol}</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => validateAmount(e.target.value)}
                    min="1"
                    step="any"
                    className="block w-full pl-12 pr-20 py-4 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-2xl font-bold"
                    style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                    placeholder="0.00"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg font-bold pointer-events-none" style={{color: "#6b7280"}}>
                    .00
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600 hover:border-blue-500 hover:bg-blue-500/10"
                      style={{backgroundColor: 'rgb(31 41 55)', color: "#d1d5db"}}
                    >
                      {currencySymbol}{quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMethod || !amount}
                  className={`w-full mb-3 sm:mb-0 inline-flex items-center justify-center px-6 py-3.5 border border-transparent rounded-lg shadow-sm text-base font-medium transition-colors ${
                    !selectedMethod || !amount ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  style={{backgroundColor: 'rgb(8 145 178)', color: "white"}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Continue to Deposit
                    </>
                  )}
                </button>
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-gray-600 rounded-lg shadow-sm text-base font-medium transition-colors hover:bg-gray-700"
                  style={{backgroundColor: 'rgb(55 65 81)', color: "#d1d5db"}}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 mb-6 p-5 border border-gray-700 rounded-lg shadow-sm" style={{backgroundColor: 'rgb(31 41 55)'}}>
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{color: "white"}}>Secure Deposit</h3>
              <p className="text-xs mt-1" style={{color: "#9ca3af"}}>
                All deposits are processed through secure payment channels. Your financial information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
