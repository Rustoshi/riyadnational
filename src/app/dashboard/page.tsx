'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Gauge,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Building2,
  Send,
  Plus,
  History,
  CreditCard,
  ChevronRight,
  User,
  Globe,
  HelpCircle,
  MessageCircle,
  Inbox,
  Clock,
  ArrowDown,
  ArrowUpDown,
  MoreHorizontal,
  Bitcoin,
  Bell,
  ShieldCheck,
  Landmark,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SendMoneyModal } from '@/components/dashboard/modals';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SecurityCard } from '@/components/dashboard/SecurityCard';
import { CashFlowCard } from '@/components/dashboard/CashFlowCard';
import { getUserCurrencySymbol } from '@/lib/currency';

interface Transaction {
  id: string;
  _id?: string;
  amount: number;
  type: string;
  status: string;
  reference?: string;
  description?: string;
  createdAt: string;
}

// Map transaction types to credit/debit for display
const isCredit = (type: string): boolean => {
  const creditTypes = ['deposit', 'transfer_in', 'bonus', 'loan'];
  return creditTypes.includes(type?.toLowerCase() || '');
};

interface QuickAction {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'gray' | 'cyan' | 'green' | 'purple';
  action?: string;
  href?: string;
}

const quickActions: QuickAction[] = [
  { name: 'Swap', icon: ArrowUpDown, color: 'gray', href: '/dashboard/swap' },
  { name: 'Send Money', icon: Send, color: 'cyan', action: 'send-money' },
  { name: 'Deposit', icon: Plus, color: 'green', href: '/dashboard/deposit' },
  { name: 'History', icon: History, color: 'purple', href: '/dashboard/transactions' },
];

const sidebarActions = [
  { name: 'Apply for Loan', description: 'Quick approval, low rates', icon: Landmark, href: '/dashboard/loans' },
  { name: 'IRS Tax Refund', description: 'Claim your tax refund', icon: Receipt, href: '/dashboard/irs-refund' },
  { name: 'Apply for Credit Card', description: 'Premium cards available', icon: CreditCard, href: '/dashboard/cards' },
];

interface DashboardData {
  balance: number;
  bitcoinBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionLimit: number;
  pendingTransactions: number;
  transactionVolume: number;
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    bitcoinBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    transactionLimit: 50000,
    pendingTransactions: 0,
    transactionVolume: 0,
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeBalanceCard, setActiveBalanceCard] = useState(0);
  const balanceCardsRef = useRef<HTMLDivElement>(null);

  // Handle swipe for balance cards
  const handleBalanceScroll = () => {
    if (balanceCardsRef.current) {
      const scrollLeft = balanceCardsRef.current.scrollLeft;
      const cardWidth = balanceCardsRef.current.offsetWidth * 0.75; // 75% card width
      const newIndex = Math.round(scrollLeft / cardWidth) > 0 ? 1 : 0;
      setActiveBalanceCard(newIndex);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/user/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Balance comes from user object in dashboard response
            const userData = data.data.user || {};
            // Map and sort transactions by date (most recent first)
            const rawTransactions = data.data.recentTransactions || [];
            const mappedTransactions: Transaction[] = rawTransactions
              .map((t: Record<string, unknown>) => {
                // Handle createdAt which could be string or Date object
                let createdAtStr = new Date().toISOString();
                if (t.createdAt) {
                  createdAtStr = typeof t.createdAt === 'string'
                    ? t.createdAt
                    : new Date(t.createdAt as Date).toISOString();
                }
                return {
                  id: (t._id as string) || (t.id as string) || '',
                  amount: (t.amount as number) || 0,
                  type: (t.type as string) || '',
                  status: (t.status as string) || 'pending',
                  reference: (t.reference as string) || (t.description as string) || 'Transaction',
                  description: (t.description as string) || '',
                  createdAt: createdAtStr,
                };
              })
              .sort((a: Transaction, b: Transaction) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

            setDashboardData({
              balance: userData.balance || 0,
              bitcoinBalance: userData.bitcoinBalance || 0,
              monthlyIncome: data.data.stats?.totalDeposits || 0,
              monthlyExpenses: data.data.stats?.totalWithdrawals || 0,
              transactionLimit: userData.transactionLimit || 50000,
              pendingTransactions: data.data.pendingTransactions || 0,
              transactionVolume: data.data.stats?.totalTransfers || 0,
              recentTransactions: mappedTransactions,
            });
            setTransactions(mappedTransactions);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const { balance: accountBalance, bitcoinBalance, monthlyIncome, monthlyExpenses, transactionLimit } = dashboardData;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      // Set greeting
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }

      // Format time
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));

      // Format date
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // BTC price state
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcLoading, setBtcLoading] = useState(true);

  // User's currency with fallback to USD
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  // Fetch live BTC price from CoinGecko in user's currency
  useEffect(() => {
    const fetchBtcPrice = async () => {
      const currencyCode = userCurrency.toLowerCase();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}&include_24hr_change=true`,
          {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.bitcoin?.[currencyCode]) {
            const price = data.bitcoin[currencyCode];
            const change = data.bitcoin[`${currencyCode}_24h_change`] || 0;
            setBtcPrice(price);
            // Update shared cache for other pages
            localStorage.setItem('btc_price_cache', JSON.stringify({ price, change, currency: userCurrency }));
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
        setBtcLoading(false);
      }
    };

    if (userCurrency) {
      fetchBtcPrice();
    }
  }, [userCurrency]);

  const formatBtc = (amount: number) => {
    if (!btcPrice || btcPrice === 0) return '---';
    const btcAmount = amount / btcPrice;
    return btcAmount.toFixed(8);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400">Completed</span>;
      case 'pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>;
      case 'rejected':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-400">Rejected</span>;
      case 'on-hold':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-400">On-hold</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <div>
              <p className="text-sm text-gray-400">{greeting} 👋</p>
              <p className="text-lg font-bold text-white">{user?.name || 'User'}</p>
            </div>
          </div>
        </div>

        {/* KYC Verification Banner - Show if not verified */}
        {user?.kycStatus !== 'verified' && (
          <Link
            href="/dashboard/kyc"
            className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-yellow-600/10 border border-yellow-700/30"
          >
            <ShieldCheck className="h-4 w-4 text-yellow-500/80 flex-shrink-0" />
            <p className="text-xs text-yellow-200/90 flex-1">Complete KYC to unlock all features</p>
            <ChevronRight className="h-4 w-4 text-yellow-500/60 flex-shrink-0" />
          </Link>
        )}

        {/* Swipeable Balance Cards */}
        <div
          ref={balanceCardsRef}
          onScroll={handleBalanceScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 -mx-4 px-4 mb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Fiat Account Card */}
          <div className="min-w-[75%] snap-center flex-shrink-0">
            <div
              className="rounded-xl p-4 text-white relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 90% 10%, rgba(6, 182, 212, 0.25) 0%, transparent 40%),
                  radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.25) 0%, transparent 40%),
                  linear-gradient(135deg, #004B87 0%, #117ACA 50%, #0a2540 100%)
                `
              }}
            >

              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs text-white/70 uppercase tracking-wide">Fiat Account</p>
                <div className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${user?.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
                  <span className="text-[10px] text-white/60">{user?.status || 'Active'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] text-white/50 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold">
                    {balanceVisible ? `${currencySymbol}${formatCurrency(accountBalance)}` : '••••••'}
                  </p>
                </div>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                >
                  {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <p className="text-[10px] text-white/40 mt-3 relative z-10">•••• {user?.accountNumber?.slice(-4) || '0000'}</p>
            </div>
          </div>

          {/* BTC Account Card */}
          <div className="min-w-[75%] snap-center flex-shrink-0">
            <div
              className="rounded-xl p-4 text-white border border-amber-500/30 relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at 10% 90%, rgba(147, 51, 234, 0.15) 0%, transparent 40%),
                  linear-gradient(135deg, #1f2937 0%, #111827 50%, #0d1117 100%)
                `
              }}
            >

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-1">
                  <Bitcoin className="h-3 w-3 text-amber-500" />
                  <p className="text-xs text-white/70 uppercase tracking-wide">Bitcoin</p>
                </div>
                <span className="text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                  1 BTC ≈ {currencySymbol}{btcPrice ? formatCurrency(btcPrice) : '---'}
                </span>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] text-white/50 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold">
                    {balanceVisible ? bitcoinBalance.toFixed(6) : '••••••'} <span className="text-sm text-white/60">BTC</span>
                  </p>
                </div>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                >
                  {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <p className="text-[10px] text-white/40 mt-3 relative z-10">≈ {currencySymbol}{btcPrice ? formatCurrency(bitcoinBalance * btcPrice) : '0'}</p>
            </div>
          </div>
        </div>

        {/* Swipe Indicator */}
        <div className="flex items-center justify-center gap-3 mb-1">
          <button
            onClick={() => {
              if (balanceCardsRef.current && activeBalanceCard === 1) {
                balanceCardsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              }
            }}
            className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${activeBalanceCard === 0 ? 'bg-gray-700 text-gray-600 cursor-not-allowed' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
            disabled={activeBalanceCard === 0}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-6 rounded-full transition-colors ${activeBalanceCard === 0 ? 'bg-blue-400' : 'bg-gray-600'}`} />
            <div className={`h-1.5 w-6 rounded-full transition-colors ${activeBalanceCard === 1 ? 'bg-amber-500' : 'bg-gray-600'}`} />
          </div>
          <button
            onClick={() => {
              if (balanceCardsRef.current && activeBalanceCard === 0) {
                balanceCardsRef.current.scrollTo({ left: balanceCardsRef.current.scrollWidth, behavior: 'smooth' });
              }
            }}
            className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${activeBalanceCard === 1 ? 'bg-gray-700 text-gray-600 cursor-not-allowed' : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'}`}
            disabled={activeBalanceCard === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mb-4">Swipe to switch between accounts</p>



        {/* Mobile Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button onClick={() => setShowSendMoneyModal(true)} className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center mb-2 shadow-lg">
              <Send className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-300">Send</span>
          </button>
          <Link href="/dashboard/deposit" className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-gray-700 flex items-center justify-center mb-2">
              <ArrowDown className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-300">Receive</span>
          </Link>
          <Link href="/dashboard/transactions" className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-gray-700 flex items-center justify-center mb-2">
              <History className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-300">History</span>
          </Link>
          <Link href="/dashboard/swap" className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-gray-700 flex items-center justify-center mb-2">
              <ArrowUpDown className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-gray-300">Swap</span>
          </Link>
        </div>



        {/* Mobile Services List */}
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <h3 className="text-sm font-medium text-white mb-3">Financial Services</h3>
          <div className="space-y-3">
            {sidebarActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'rgb(55 65 81)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-white">{action.name}</p>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Recent Transactions */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgb(55 65 81)' }}>
            <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400">View all</Link>
          </div>
          <div className="p-4">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => {
                  const isCreditTx = isCredit(transaction.type);
                  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isCreditTx ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                          {isCreditTx ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">{transaction.reference || transaction.description || 'Transaction'}</p>
                          <p className="text-xs text-gray-400">{formattedDate}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-medium ${isCreditTx ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {isCreditTx ? '+' : '-'}{currencySymbol}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Inbox className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No recent transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cards Section */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgb(55 65 81)' }}>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white" />
              <h3 className="text-sm font-medium text-white">Your Cards</h3>
            </div>
            <Link href="/dashboard/cards" className="text-xs text-blue-400">View all</Link>
          </div>
          <div className="p-4">
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="rounded-full p-3 mb-3" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                <CreditCard className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-white">No cards yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">Apply for a virtual card for secure payments</p>
              <Link
                href="/dashboard/cards/apply"
                className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" /> Apply for Card
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Cash Flow */}
        <div className="mb-6">
          <CashFlowCard
            income={dashboardData.monthlyIncome}
            expenses={dashboardData.monthlyExpenses}
            currency={userCurrency}
          />
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      {/* Top Stats Summary Bar - Desktop Only */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div>
            <p className="text-xs text-white">Current Balance</p>
            <p className="text-lg font-bold text-white">{currencySymbol}{formatCurrency(accountBalance)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div>
            <p className="text-xs text-white">Monthly Income</p>
            <p className="text-lg font-bold text-white">{currencySymbol}{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div>
            <p className="text-xs text-white">Monthly Outgoing</p>
            <p className="text-lg font-bold text-white">{currencySymbol}{formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-400" />
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div>
            <p className="text-xs text-white">Transaction Limit</p>
            <p className="text-lg font-bold text-white">{currencySymbol}{formatCurrency(transactionLimit)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Gauge className="h-5 w-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid - Desktop Only */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance and Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="rounded-2xl shadow-lg text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #020617 100%)' }}>
            {/* Card Header */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{settings.siteName}</h3>
                    <p className="text-xs text-white/60">Primary Account</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20">
                  <p className="text-xs text-white/60">ACCOUNT NUMBER</p>
                  <p className="text-sm font-mono font-medium text-white">•••••• {user?.accountNumber?.slice(-4) || '0000'}</p>
                </div>
              </div>
            </div>

            {/* Card Body - Balances */}
            <div className="p-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
                {/* Account Holder */}
                <div>
                  <p className="text-xs text-white/60 mb-1">Account Holder</p>
                  <p className="font-semibold text-white text-lg">{user?.name || 'User'}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center text-xs">
                      <span className={`h-2 w-2 rounded-full mr-1.5 ${user?.status === 'active' ? 'bg-green-400' :
                        user?.status === 'inactive' ? 'bg-yellow-400' :
                          user?.status === 'dormant' ? 'bg-orange-400' :
                            user?.status === 'suspended' ? 'bg-red-400' :
                              user?.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                      <span className={`${user?.status === 'active' ? 'text-green-300' :
                        user?.status === 'inactive' ? 'text-yellow-300' :
                          user?.status === 'dormant' ? 'text-orange-300' :
                            user?.status === 'suspended' ? 'text-red-300' :
                              user?.status === 'blocked' ? 'text-red-400' : 'text-gray-300'
                        }`}>
                        Account {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}
                      </span>
                    </span>
                  </div>
                  {user?.kycStatus !== 'approved' && (
                    <Link href="/dashboard/kyc" className="flex items-center gap-2 mt-1 group">
                      <span className="inline-flex items-center text-xs">
                        <span className="h-2 w-2 rounded-full bg-orange-400 mr-1.5" />
                        <span className="text-orange-300 group-hover:text-orange-200">Verification Required</span>
                      </span>
                    </Link>
                  )}
                </div>

                {/* Fiat Balance */}
                <div className="text-center">
                  <p className="text-xs text-white/60 mb-1">Fiat Balance</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold text-white">
                      {balanceVisible ? `${currencySymbol}${formatCurrency(accountBalance)}` : '••••••'}
                    </p>
                    <button
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="text-white/60 hover:text-white focus:outline-none transition-all"
                    >
                      {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{userCurrency} Balance</p>
                </div>

                {/* Bitcoin Balance */}
                <div className="text-center">
                  <p className="text-xs text-white/60 mb-1">Bitcoin Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {balanceVisible ? `${bitcoinBalance.toFixed(6)} BTC` : '••••••••'}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    ≈ {currencySymbol}{btcPrice ? formatCurrency(bitcoinBalance * btcPrice) : '0'}
                  </p>
                  <p className="text-xs text-blue-300 flex items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    1 BTC = {currencySymbol}{btcPrice ? formatCurrency(btcPrice) : '---'}
                  </p>
                </div>
              </div>

              {/* Total Portfolio & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="bg-white/10 backdrop-blur px-5 py-3 rounded-xl border border-white/10">
                  <p className="text-xs text-white/60">Total Portfolio</p>
                  <p className="text-xl font-bold text-blue-300">
                    {balanceVisible
                      ? `${currencySymbol}${formatCurrency(accountBalance + bitcoinBalance * (btcPrice || 0))}`
                      : '••••••'
                    }
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSendMoneyModal(true)}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" /> Send
                  </button>
                  <Link
                    href="/dashboard/deposit"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <ArrowDown className="h-4 w-4 mr-2" /> Receive
                  </Link>
                  <Link
                    href="/dashboard/transactions"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <History className="h-4 w-4 mr-2" /> History
                  </Link>
                  <Link
                    href="/dashboard/swap"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" /> Swap
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold mb-1 text-white">Financial Services</h1>
                <p className="text-gray-400">Choose from our popular actions below</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sidebarActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center p-4 rounded-xl transition-all hover:bg-white/5"
                  style={{ backgroundColor: 'rgb(55 65 81)' }}
                >
                  <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                    <action.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg">{action.name}</h4>
                    <p className="text-gray-400">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Cards Section */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgb(55 65 81)' }}>
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-white mr-2" />
                <h3 className="text-lg font-medium text-white">Your Cards</h3>
              </div>
              <Link href="/dashboard/cards" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="p-6">
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="rounded-full p-3 mb-4" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                  <CreditCard className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white">No cards yet</h3>
                <p className="text-white text-sm mt-2 mb-4 max-w-md">
                  You haven&apos;t applied for any virtual cards yet. Apply for a new card to get started with secure online payments.
                </p>
                <Link
                  href="/dashboard/cards/apply"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Apply for Card
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgb(55 65 81)' }}>
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-white mr-2" />
                <h3 className="text-lg font-medium text-gray-100">Recent Transactions</h3>
              </div>
              <Link href="/dashboard/transactions" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {transactions.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead style={{ backgroundColor: 'rgb(55 65 81)' }}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"></th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reference</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                    {transactions.map((transaction) => {
                      const isCreditTx = isCredit(transaction.type);
                      const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isCreditTx ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                              {isCreditTx ? (
                                <Plus className="h-5 w-5 text-green-400" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isCreditTx ? 'text-green-400' : 'text-red-400'}`}>
                              {isCreditTx ? '+' : '-'}{currencySymbol}{formatCurrency(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCreditTx ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                              {isCreditTx ? 'Credit' : 'Debit'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {transaction.reference || transaction.description || 'Transaction'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formattedDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Inbox className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-lg font-medium text-white">No recent transactions</p>
                  <p className="text-sm text-white mt-1 mb-4">Your transaction history will appear here</p>
                  <Link
                    href="/dashboard/deposit"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Make your first deposit
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats and Notices */}
        <div className="space-y-6">
          {/* Cash Flow Card */}
          <CashFlowCard
            income={dashboardData.monthlyIncome}
            expenses={dashboardData.monthlyExpenses}
            currency={userCurrency}
          />

          {/* Account Stats Card */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgb(55 65 81)' }}>
              <h3 className="text-lg font-medium text-white" style={{
                color: "white"
              }}>Account Statistics</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Transaction Limit</p>
                  <p className="text-lg font-bold text-white truncate">{currencySymbol}{formatCurrency(transactionLimit)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-4">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Pending Transactions</p>
                  <p className="text-lg font-bold text-white truncate">{currencySymbol}{formatCurrency(dashboardData.pendingTransactions)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Transaction Volume</p>
                  <p className="text-lg font-bold text-white truncate">{currencySymbol}{formatCurrency(dashboardData.transactionVolume)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                  <History className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400">Account Age</p>
                  <p className="text-lg font-bold text-gray-100 truncate">
                    {user?.createdAt
                      ? (() => {
                        const created = new Date(user.createdAt);
                        const now = new Date();
                        const diffMs = now.getTime() - created.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        if (diffDays < 1) return 'Today';
                        if (diffDays === 1) return '1 day';
                        if (diffDays < 30) return `${diffDays} days`;
                        if (diffDays < 60) return '1 month';
                        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
                        if (diffDays < 730) return '1 year';
                        return `${Math.floor(diffDays / 365)} years`;
                      })()
                      : 'New Account'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Center (Replaces duplicate Quick Actions) */}
          <SecurityCard />

          {/* Help & Support Card */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <HelpCircle className="h-10 w-10 text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-white text-center mb-2">Need Help?</h3>
              <p className="text-sm text-white text-center mb-4">Our support team is here to assist you 24/7</p>
              <div className="flex justify-center">
                <Link
                  href="/dashboard/support"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SendMoneyModal
        isOpen={showSendMoneyModal}
        onClose={() => setShowSendMoneyModal(false)}
      />
    </div>
  );
}
