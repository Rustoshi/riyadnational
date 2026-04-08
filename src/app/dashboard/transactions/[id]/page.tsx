'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  Home,
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  Hash,
  User,
  DollarSign,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  createdAt: string;
  metadata?: {
    recipientName?: string;
    recipientAccount?: string;
    recipientBank?: string;
    accountType?: string;
    bankAddress?: string;
    country?: string;
    swiftCode?: string;
    iban?: string;
    cryptoCurrency?: string;
    cryptoNetwork?: string;
    walletAddress?: string;
    paypalEmail?: string;
    wiseFullName?: string;
    wiseEmail?: string;
    zelleEmail?: string;
    zelleName?: string;
    venmoUsername?: string;
    cashAppTag?: string;
    paymentMethod?: string;
    [key: string]: unknown;
  };
}

// Map transaction types to credit/debit
const isCredit = (type: string): boolean => {
  const creditTypes = ['deposit', 'transfer_in', 'bonus', 'loan'];
  return creditTypes.includes(type?.toLowerCase() || '');
};

// Get payment method display name
const getPaymentMethodLabel = (metadata?: Transaction['metadata']): string => {
  if (!metadata?.paymentMethod) return 'Bank Transfer';
  const methods: Record<string, string> = {
    wire: 'International Wire Transfer',
    domestic: 'Domestic Transfer',
    crypto: 'Cryptocurrency',
    paypal: 'PayPal',
    wise: 'Wise Transfer',
    zelle: 'Zelle',
    venmo: 'Venmo',
    cashapp: 'Cash App',
  };
  return methods[metadata.paymentMethod] || metadata.paymentMethod;
};

export default function TransactionReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's currency
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/user/transactions/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Transaction not found');
          } else {
            setError('Failed to load transaction');
          }
          return;
        }

        const data = await response.json();
        setTransaction(data.data);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Failed to load transaction');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTransaction();
    }
  }, [params.id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 mt-4">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Transaction not found'}</h2>
          <p className="text-gray-400 mb-6">The transaction you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  const isCreditTx = isCredit(transaction.type);
  const paymentMethod = getPaymentMethodLabel(transaction.metadata);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Action Buttons - Hidden on print */}
      <div className="flex justify-end mb-4 gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      </div>

      {/* Receipt Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
        {/* Receipt Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold">{settings.siteName}</h1>
                <p className="text-sm text-white/80">Transaction Receipt</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                transaction.status === 'completed' ? 'bg-green-400/20' : 
                transaction.status === 'pending' ? 'bg-yellow-400/20' : 'bg-red-400/20'
              }`}>
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium capitalize">{transaction.status}</span>
              </div>
              <p className="text-sm mt-1 text-white/80">Ref: {transaction.reference}</p>
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute left-0 right-0 bottom-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-8 w-full text-white fill-current">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 md:p-8">
          {/* Transaction Info */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Transaction Details</h2>
            <p className="text-gray-600 text-sm mb-4">
              {isCreditTx ? 'You received' : 'You transferred'} {currencySymbol}{formatCurrency(transaction.amount)}
              {transaction.metadata?.recipientName && ` to ${transaction.metadata.recipientName}`}.
            </p>

            {/* Transaction Summary Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Transaction Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm font-medium text-gray-900">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Transaction Time</p>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm font-medium text-gray-900">{formatTime(transaction.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm font-medium text-gray-900">{paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reference ID</p>
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm font-medium text-gray-900">{transaction.reference}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">Recipient Details</h2>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transaction.metadata.recipientName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Name</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.recipientName}</p>
                    </div>
                  )}
                  {transaction.metadata.recipientAccount && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.recipientAccount}</p>
                    </div>
                  )}
                  {transaction.metadata.recipientBank && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.recipientBank}</p>
                    </div>
                  )}
                  {transaction.metadata.accountType && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{transaction.metadata.accountType}</p>
                    </div>
                  )}
                  {transaction.metadata.swiftCode && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Swift Code</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.swiftCode}</p>
                    </div>
                  )}
                  {transaction.metadata.iban && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">IBAN/Routing</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.iban}</p>
                    </div>
                  )}
                  {transaction.metadata.country && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Country</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.country}</p>
                    </div>
                  )}
                  {transaction.metadata.walletAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{transaction.metadata.walletAddress}</p>
                    </div>
                  )}
                  {transaction.metadata.cryptoCurrency && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cryptocurrency</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.cryptoCurrency}</p>
                    </div>
                  )}
                  {transaction.metadata.paypalEmail && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">PayPal Email</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.paypalEmail}</p>
                    </div>
                  )}
                  {transaction.metadata.zelleEmail && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Zelle Email</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.zelleEmail}</p>
                    </div>
                  )}
                  {transaction.metadata.venmoUsername && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Venmo Username</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.venmoUsername}</p>
                    </div>
                  )}
                  {transaction.metadata.cashAppTag && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cash App Tag</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.metadata.cashAppTag}</p>
                    </div>
                  )}
                </div>

                {transaction.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Details */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Financial Details</h2>
            </div>

            <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount {isCreditTx ? 'Received' : 'Sent'}</p>
                    <p className={`text-base font-medium ${isCreditTx ? 'text-green-600' : 'text-red-600'}`}>
                      {isCreditTx ? '+' : '-'}{currencySymbol}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Handling & Charges</p>
                    <p className="text-base font-medium text-gray-900">{currencySymbol}0.00</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700">Balance After</p>
                    <p className="text-lg font-bold text-blue-700">{currencySymbol}{formatCurrency(transaction.balanceAfter)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-1">This receipt serves as confirmation of this transaction.</p>
            <p className="text-xs text-gray-500">For any issues or inquiries regarding this transaction, please contact support.</p>
            <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
