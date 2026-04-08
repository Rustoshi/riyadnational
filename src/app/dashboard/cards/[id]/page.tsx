'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Lock,
  Pause,
  Shield,
  AlertTriangle,
  Loader2,
  Wifi,
  Play,
  Ban,
  History,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

interface Card {
  _id: string;
  cardNumber: string;
  cardNumberLast4: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  cardType: string;
  balance: number;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  approvedAt?: string;
}

interface CardTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function CardDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [card, setCard] = useState<Card | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  useEffect(() => {
    const fetchCardDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [cardRes, transactionsRes] = await Promise.all([
          fetch(`/api/user/cards/${resolvedParams.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/user/cards/${resolvedParams.id}/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (cardRes.ok) {
          const cardData = await cardRes.json();
          setCard(cardData.data);
        } else {
          toast.error('Card not found');
          router.push('/dashboard/cards');
        }

        if (transactionsRes.ok) {
          const transData = await transactionsRes.json();
          setTransactions(transData.data?.transactions || []);
        }
      } catch (error) {
        console.error('Failed to fetch card details:', error);
        toast.error('Failed to load card details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardDetails();
  }, [resolvedParams.id, router]);

  const handleCardAction = async (action: 'activate' | 'block') => {
    if (!card) return;

    setIsActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/cards/${card._id}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Card ${action}d successfully`);
        setCard(data.data);
      } else {
        toast.error(data.message || `Failed to ${action} card`);
      }
    } catch (error) {
      console.error(`Card ${action} error:`, error);
      toast.error(`Failed to ${action} card`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="h-4 w-4 mr-1.5" /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400">
            <Clock className="h-4 w-4 mr-1.5" /> Pending Approval
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
            <Lock className="h-4 w-4 mr-1.5" /> Blocked
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
            <Pause className="h-4 w-4 mr-1.5" /> Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getCardGradient = (cardType: string) => {
    switch (cardType) {
      case 'visa':
        return 'bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500';
      case 'mastercard':
        return 'bg-gradient-to-br from-red-700 via-orange-600 to-orange-500';
      default:
        return 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Card Not Found</h2>
          <p className="text-gray-400 mb-4">The card you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/cards"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Breadcrumbs + Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm">
              <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
              <Link href="/dashboard/cards" className="text-gray-500 hover:text-blue-400">
                Cards
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
              <span className="text-gray-300">Card Details</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">Card Details</h1>
          </div>
          <Link
            href="/dashboard/cards"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cards
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Card Visual & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Visual */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">Your Card</h2>
              {getStatusBadge(card.status)}
            </div>

            {/* Card Representation */}
            <div className="w-full aspect-[1.586/1] relative overflow-hidden rounded-xl">
              <div className={`absolute inset-0 ${getCardGradient(card.cardType)}`}></div>

              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-semibold text-sm tracking-wider">
                      {settings?.siteName || 'Virtual Banking'}
                    </div>
                    <div className="text-white/70 text-xs">Virtual Card</div>
                  </div>
                  <Wifi className="h-5 w-5 text-white/75 rotate-90" />
                </div>

                {/* Card Number */}
                <div className="font-mono text-lg text-white tracking-widest">
                  {showCardNumber
                    ? formatCardNumber(card.cardNumber)
                    : `•••• •••• •••• ${card.cardNumberLast4}`}
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs uppercase text-white/70 mb-1">Card Holder</div>
                    <div className="text-white font-medium text-sm truncate max-w-[180px]">
                      {card.cardholderName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-white/70 mb-1">Valid Thru</div>
                    <div className="text-white font-medium text-sm">
                      {card.expiryMonth}/{card.expiryYear.slice(-2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Balance */}
            {card.status === 'active' && (
              <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Card Balance</div>
                <div className="text-2xl font-bold text-white">
                  {currencySymbol}
                  {card.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {/* Card Actions */}
            {card.status !== 'pending' && (
              <div className="mt-4 flex gap-3">
                {card.status === 'blocked' ? (
                  <button
                    onClick={() => handleCardAction('activate')}
                    disabled={isActionLoading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm font-medium transition-colors"
                  >
                    {isActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Unblock Card
                      </>
                    )}
                  </button>
                ) : card.status === 'active' ? (
                  <button
                    onClick={() => handleCardAction('block')}
                    disabled={isActionLoading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm font-medium transition-colors"
                  >
                    {isActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" /> Block Card
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            )}

            {/* Pending Notice */}
            {card.status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex">
                  <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-400">Pending Approval</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Your card application is being reviewed. You will be notified once it&apos;s
                      approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Card Details & Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Details */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-lg font-medium text-white">Card Information</h2>
            </div>

            <div className="p-6">
              {card.status === 'active' && (
                <>
                  {/* Sensitive Card Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Card Number */}
                    <div className="p-4 bg-[#0a0a0a] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Card Number</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowCardNumber(!showCardNumber)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showCardNumber ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(card.cardNumber, 'Card number')}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-white">
                        {showCardNumber
                          ? formatCardNumber(card.cardNumber)
                          : `•••• •••• •••• ${card.cardNumberLast4}`}
                      </div>
                    </div>

                    {/* CVV */}
                    <div className="p-4 bg-[#0a0a0a] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">CVV</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowCVV(!showCVV)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showCVV ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(card.cvv, 'CVV')}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-white">{showCVV ? card.cvv : '•••'}</div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-amber-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-400">Security Notice</h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Never share your card details with anyone. We will never ask for your CVV
                          or full card number via email or phone.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* General Card Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Card Type</div>
                  <div className="text-white capitalize">{card.cardType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Expiry Date</div>
                  <div className="text-white">
                    {card.expiryMonth}/{card.expiryYear}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Daily Limit</div>
                  <div className="text-white">
                    {currencySymbol}
                    {card.dailyLimit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Monthly Limit</div>
                  <div className="text-white">
                    {currencySymbol}
                    {card.monthlyLimit.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              {card.billingAddress && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Billing Address</h3>
                  <div className="text-white">
                    <p>{card.billingAddress.street}</p>
                    <p>
                      {card.billingAddress.city}, {card.billingAddress.state}{' '}
                      {card.billingAddress.zipCode}
                    </p>
                    <p>{card.billingAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Recent Transactions</h2>
              <History className="h-5 w-5 text-gray-400" />
            </div>

            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {transactions.map((tx) => (
                  <div key={tx._id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.type === 'topup'
                            ? 'bg-green-500/10'
                            : tx.type === 'fee'
                            ? 'bg-amber-500/10'
                            : 'bg-red-500/10'
                        }`}
                      >
                        {tx.type === 'topup' ? (
                          <ArrowDownLeft
                            className={`h-4 w-4 ${
                              tx.type === 'topup' ? 'text-green-400' : 'text-red-400'
                            }`}
                          />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-white font-medium capitalize">
                          {tx.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-400">{tx.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          tx.type === 'topup' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'topup' ? '+' : '-'}
                        {currencySymbol}
                        {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <History className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Transactions will appear here once you start using your card.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
