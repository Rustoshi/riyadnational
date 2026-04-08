'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  FileText,
  Inbox,
  Calendar,
  X,
  Loader2,
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
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Map transaction types to credit/debit
const isCredit = (type: string): boolean => {
  const creditTypes = ['deposit', 'transfer_in', 'bonus', 'loan'];
  return creditTypes.includes(type?.toLowerCase() || '');
};

// Get human-readable type label
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    bonus: 'Bonus',
    fee: 'Fee',
    investment: 'Investment',
    loan: 'Loan',
    card_topup: 'Card Top-up',
    card_deduct: 'Card Deduction',
  };
  return labels[type?.toLowerCase()] || type;
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  
  // User's currency
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortOrder: filters.sortOrder,
      });

      if (search) params.append('search', search);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/user/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions || []);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilterModal(false);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      type: '',
      startDate: '',
      endDate: '',
      sortOrder: 'desc',
    });
    setSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'on-hold':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">On-hold</span>;
      case 'rejected':
      case 'failed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{status}</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{color: "white"}}>Transactions</h1>
          <div className="flex items-center text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span style={{color: "#d1d5db"}}>Transactions</span>
          </div>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" /> Filter
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Search by reference or description..."
          />
        </div>
      </form>

      {/* Transactions Table */}
      <div className="rounded-xl shadow-sm border border-gray-700 overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2" style={{color: "#9ca3af"}}>Loading transactions...</p>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const isCreditTx = isCredit(transaction.type);
                  return (
                    <tr key={transaction._id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isCreditTx ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {isCreditTx ? (
                            <Plus className="h-5 w-5 text-green-400" />
                          ) : (
                            <Minus className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isCreditTx ? 'text-green-400' : 'text-red-400'}`}>
                          {isCreditTx ? '+' : '-'}{currencySymbol}{formatCurrency(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isCreditTx ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isCreditTx ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: "#9ca3af"}}>
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm max-w-[200px] truncate" style={{color: "#9ca3af"}}>
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: "#9ca3af"}}>
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/transactions/${transaction._id}`}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Inbox className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-lg font-medium" style={{color: "white"}}>No transactions found</p>
                    <p className="text-sm mt-1" style={{color: "#9ca3af"}}>Try adjusting your search or filter parameters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <div className="text-sm" style={{color: "#9ca3af"}}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm" style={{color: "#9ca3af"}}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowFilterModal(false)}
            />
            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-gray-800 rounded-xl shadow-xl transform transition-all border border-gray-700">
              <button
                onClick={() => setShowFilterModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-500/20 mb-4">
                  <Filter className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium" style={{color: "white"}}>Filter Transactions</h3>
                <p className="mt-1 text-sm" style={{color: "#9ca3af"}}>Customize your transaction view</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="on-hold">On-hold</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Transaction Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer_in">Transfer In</option>
                    <option value="transfer_out">Transfer Out</option>
                    <option value="bonus">Bonus</option>
                    <option value="fee">Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowExportModal(false)}
            />
            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-gray-800 rounded-xl shadow-xl transform transition-all border border-gray-700">
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-500/20 mb-4">
                  <Download className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium" style={{color: "white"}}>Export Transactions</h3>
                <p className="mt-1 text-sm" style={{color: "#9ca3af"}}>Download your transaction history</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">File Format</label>
                  <select className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="date"
                      className="block w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
