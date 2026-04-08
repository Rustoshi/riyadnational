'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Settings,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  StatusBadge,
  Pagination,
  PageInfo,
} from '@/components/ui';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  accountNumber: string;
  balance: number;
  status: string;
  kycStatus: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUsers(data.data || []);
        setTotalUsers(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="space-y-6 pb-32">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage all registered users on the platform
          </p>
        </div>
        <Link href="/admin/users/create">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or account number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-40"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card padding="none" className="overflow-visible">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-20 bg-[var(--bg)] rounded animate-pulse" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No users found</div>
          ) : (
            users.map((user) => (
              <div key={user._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--primary)]">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      <p className="text-xs font-mono text-[var(--text-muted)] truncate">{user.accountNumber}</p>
                    </div>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-xs">KYC:</span>
                    <StatusBadge status={user.kycStatus} />
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(user.balance)}</span>
                </div>
                <Link
                  href={`/admin/users/${user._id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-medium text-sm hover:bg-[var(--primary-dark)] transition-colors"
                >
                  <Settings className="w-4 h-4" /> Manage User
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Account</TableHead>
                <TableHead align="right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <div className="h-12 bg-[var(--bg)] rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableEmpty message="No users found" colSpan={7} />
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                          <span className="text-sm font-medium text-[var(--primary)]">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{user.accountNumber}</span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-medium">{formatCurrency(user.balance)}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.kycStatus} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--border)]">
            <PageInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalUsers}
              itemsPerPage={limit}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
