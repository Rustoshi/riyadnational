'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  ChevronRight,
  CheckCircle,
  Clock,
  Lock,
  Pause,
  Shield,
  Globe,
  Sliders,
  Zap,
  Wallet,
  Loader2,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';

interface Card {
  _id: string;
  cardNumber: string;
  cardNumberLast4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  cardType: string;
  balance: number;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
}

export default function CardsPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  // Stats
  const activeCards = cards.filter((c) => c.status === 'active').length;
  const pendingCards = cards.filter((c) => c.status === 'pending').length;
  const totalBalance = cards
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.balance, 0);

  useEffect(() => {
    const fetchCards = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/user/cards', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCards(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <Lock className="h-3 w-3 mr-1" /> Blocked
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-white">
            <Pause className="h-3 w-3 mr-1" /> Inactive
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
              <span className="text-gray-300">Cards</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Virtual Cards</h1>
          </div>
          <Link
            href="/dashboard/cards/apply"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" /> Apply for Card
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500/10 rounded-lg p-3">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "#ffffff"}}>Active Cards</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>{activeCards}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500/10 rounded-lg p-3">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "#ffffff"}}>Pending Applications</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>{pendingCards}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500/10 rounded-lg p-3">
              <Wallet className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "#ffffff"}}>Total Card Balance</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>
                {currencySymbol}
                {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-[#004B87]/50 to-[#117ACA]/30 rounded-xl overflow-hidden border border-blue-800/50 mb-6">
        <div className="md:flex">
          <div className="p-6 md:flex-1">
            <h2 className="text-white text-xl font-bold mb-2" style={{color: "white"}}>Virtual Cards Made Easy</h2>
            <p className="text-gray-300 mb-4" style={{color: "#d1d5db"}}>
              Create virtual cards for secure online payments, subscription management, and more.
              Our virtual cards offer enhanced security and control over your spending.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/10 rounded-lg p-2">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-white text-sm font-medium" style={{color: "white"}}>Secure Payments</h3>
                  <p className="text-white text-xs" style={{color: "#ffffff"}}>
                    Protect your main account with separate virtual cards
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/10 rounded-lg p-2">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-white text-sm font-medium" style={{color: "white"}}>Global Acceptance</h3>
                  <p className="text-white text-xs" style={{color: "#ffffff"}}>
                    Use anywhere major cards are accepted online
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/10 rounded-lg p-2">
                  <Sliders className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-white text-sm font-medium" style={{color: "white"}}>Spending Controls</h3>
                  <p className="text-white text-xs" style={{color: "#ffffff"}}>
                    Set limits and monitor transactions in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/10 rounded-lg p-2">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-white text-sm font-medium" style={{color: "white"}}>Instant Issuance</h3>
                  <p className="text-white text-xs" style={{color: "#ffffff"}}>Create and use cards within minutes</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard/cards/apply"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-[#004B87] text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Apply Now
              </Link>
            </div>  
          </div>

          {/* Card Preview */}
          <div className="hidden md:flex md:items-center md:justify-center md:w-1/3 p-6">
            <div className="relative w-48 h-32">
              <div className="absolute w-full h-full transform rotate-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg"></div>
              <div className="absolute w-full h-full rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 shadow-lg">
                <div className="p-4 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-mono text-white/75">Virtual Card</div>
                    <Wifi className="h-4 w-4 text-white/75 rotate-90" />
                  </div>
                  <div className="text-xs font-mono text-white mt-4">•••• •••• •••• 1234</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs font-mono text-white/75">VALID THRU</div>
                      <div className="text-xs font-mono text-white">12/25</div>
                    </div>
                    <CreditCard className="h-6 w-6 text-white/75" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Listings */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-8">
        <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white" style={{color: "white"}}>Your Cards</h2>
          <Link
            href="/dashboard/cards/apply"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> New Card
          </Link>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {cards.map((card) => (
              <div
                key={card._id}
                className="bg-[#0a0a0a] rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden"
              >
                {/* Card Header with Status */}
                <div className="px-4 pt-4 pb-2 flex justify-between items-center">
                  {getStatusBadge(card.status)}
                  <div className="text-xs text-gray-500 capitalize">{card.cardType}</div>
                </div>

                {/* Card Representation */}
                <div className="px-4 py-3">
                  <div className="w-full h-44 relative overflow-hidden">
                    <div
                      className={`absolute inset-0 rounded-xl ${getCardGradient(card.cardType)}`}
                    ></div>

                    {/* Card Content */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      {/* Top Section */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold text-sm tracking-wider" style={{color: "white"}}>
                            {settings?.siteName || 'Virtual Banking'}
                          </div>
                          <div className="text-white/70 text-xs" style={{color: "white/70"}}>Virtual Card</div>
                        </div>
                        <Wifi className="h-4 w-4 text-white/75 rotate-90" />
                      </div>

                      {/* Card Number */}
                      <div className="font-mono text-base text-white tracking-widest" style={{color: "white"}}>
                        •••• •••• •••• {card.cardNumberLast4}
                      </div>

                      {/* Bottom Section */}
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs uppercase text-white/70 mb-1">Card Holder</div>
                          <div className="text-white font-medium text-sm truncate max-w-[150px]">
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
                </div>

                {/* Card Details */}
                <div className="px-4 py-3 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-white capitalize">
                      {card.cardType.replace('_', ' ')}
                    </div>
                    {card.status === 'active' && (
                      <div className="text-sm font-semibold text-white" style={{color: "white"}}>
                        {currencySymbol}
                        {card.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/cards/${card._id}`}
                    className="block w-full mt-2 text-center px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-800 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-800 mb-4">
              <CreditCard className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white" style={{color: "white"}}>No cards yet</h3>
            <p className="mt-1 text-sm text-white max-w-md mx-auto" style={{color: "white"}}>
              You haven&apos;t applied for any virtual cards yet. Apply for a new card to get
              started with secure online payments.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/cards/apply"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Apply for Card
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-6" style={{color: "white"}}>How Virtual Cards Work</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/10 mb-4">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color: "white"}}>1. Apply</h3>
            <p className="text-white">
              Complete the application form for your virtual card. Select your preferred card type
              and set your spending limits.
            </p>
          </div>

          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/10 mb-4">
              <CheckCircle className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color: "white"}}>2. Activate</h3>
            <p className="text-white">
              Once approved, your virtual card will be ready to use. View the card details and
              activate it from your dashboard.
            </p>
          </div>

          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/10 mb-4">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color: "white"}}>3. Use</h3>
            <p className="text-white">
              Use your virtual card for online transactions anywhere major credit cards are
              accepted. Monitor transactions in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-medium text-white" style={{color: "white"}}>Frequently Asked Questions</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <dt className="text-base font-medium text-white" style={{color: "white"}}>What is a virtual card?</dt>
            <dd className="mt-2 text-sm text-white">
              A virtual card is a digital payment card that can be used for online transactions. It
              works just like a physical card but exists only in digital form, providing enhanced
              security for online purchases.
            </dd>
          </div>

          <div>
            <dt className="text-base font-medium text-white" style={{color: "white"}}>How secure are virtual cards?</dt>
            <dd className="mt-2 text-sm text-white">
              Virtual cards offer additional security as they&apos;re separate from your primary
              account. You can create cards with specific spending limits and even create single-use
              cards for enhanced protection against fraud.
            </dd>
          </div>

          <div>
            <dt className="text-base font-medium text-white" style={{color: "white"}}>Can I have multiple virtual cards?</dt>
            <dd className="mt-2 text-sm text-white">
              Yes, you can apply for multiple virtual cards for different purposes - such as one for
              subscriptions, another for shopping, etc. Each card can have its own limits and
              settings.
            </dd>
          </div>

          <div>
            <dt className="text-base font-medium text-white" style={{color: "white"}}>
              How long does it take to get a virtual card?
            </dt>
            <dd className="mt-2 text-sm text-white">
              Virtual cards are typically issued within minutes after approval. Once approved, you
              can immediately view and use the card details for online transactions.
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
