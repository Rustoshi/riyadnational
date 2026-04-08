'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { StatsCard, AdminActionsGrid } from '@/components/admin';
import { Card, CardHeader, CardTitle, Badge, StatusBadge } from '@/components/ui';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBalance: number;
  pendingKyc: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    user?: { name: string };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change={12}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Deposits"
          value={formatCurrency(stats?.totalDeposits || 0)}
          change={8}
          icon={<ArrowDownToLine className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Withdrawals"
          value={formatCurrency(stats?.totalWithdrawals || 0)}
          change={-3}
          icon={<ArrowUpFromLine className="w-5 h-5" />}
        />
        <StatsCard
          title="Platform Balance"
          value={formatCurrency(stats?.totalBalance || 0)}
          change={15}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* Admin Actions Section */}
      <AdminActionsGrid />

      {/* Pending Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/deposits?status=pending">
          <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Pending Deposits</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                  {stats?.pendingDeposits || 0}
                </p>
              </div>
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--warning-light)]">
                <ArrowDownToLine className="w-5 h-5 text-[var(--warning)]" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/withdrawals?status=pending">
          <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Pending Withdrawals</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                  {stats?.pendingWithdrawals || 0}
                </p>
              </div>
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--warning-light)]">
                <ArrowUpFromLine className="w-5 h-5 text-[var(--warning)]" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/kyc?status=pending">
          <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Pending KYC</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                  {stats?.pendingKyc || 0}
                </p>
              </div>
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--warning-light)]">
                <FileCheck className="w-5 h-5 text-[var(--warning)]" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card padding="none">
          <CardHeader className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between w-full">
              <CardTitle>Recent Users</CardTitle>
              <Link
                href="/admin/users"
                className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-[var(--border)]">
            {stats?.recentUsers?.length ? (
              stats.recentUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--primary)]">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={user.status} />
                    <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                No recent users
              </div>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card padding="none">
          <CardHeader className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between w-full">
              <CardTitle>Recent Transactions</CardTitle>
              <Link
                href="/admin/deposits"
                className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-[var(--border)]">
            {stats?.recentTransactions?.length ? (
              stats.recentTransactions.slice(0, 5).map((txn) => (
                <div key={txn._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg)]">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-[var(--radius-md)] ${txn.type === 'deposit' ? 'bg-[var(--success-light)]' : 'bg-[var(--error-light)]'
                      }`}>
                      {txn.type === 'deposit' ? (
                        <ArrowDownToLine className={`w-4 h-4 text-[var(--success)]`} />
                      ) : (
                        <ArrowUpFromLine className={`w-4 h-4 text-[var(--error)]`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{txn.type}</p>
                      <p className="text-xs text-[var(--text-muted)]">{txn.user?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {formatCurrency(txn.amount)}
                    </p>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                No recent transactions
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
