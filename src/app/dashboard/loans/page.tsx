'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, Landmark, Clock, CheckCircle, XCircle, DollarSign,
  Loader2, Plus, FileText, AlertCircle, Banknote,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

interface Loan {
  _id: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  purpose: string;
  status: string;
  paidAmount: number;
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
}

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, pending: 0, totalBorrowed: 0 });

  const currencySymbol = getUserCurrencySymbol(user?.currency || 'USD');

  useEffect(() => {
    const fetchLoans = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/user/loans?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const loansList = data.data || [];
          setLoans(loansList);

          // Calculate stats
          const active = loansList.filter((l: Loan) => l.status === 'active').length;
          const pending = loansList.filter((l: Loan) => l.status === 'pending').length;
          const totalBorrowed = loansList
            .filter((l: Loan) => ['active', 'paid'].includes(l.status))
            .reduce((sum: number, l: Loan) => sum + l.amount, 0);
          setStats({ active, pending, totalBorrowed });
        }
      } catch (error) {
        console.error('Failed to fetch loans:', error);
        toast.error('Failed to load loans');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
            {status}
          </span>
        );
    }
  };

  const formatDuration = (months: number) => {
    if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    let result = `${years} Year${years > 1 ? 's' : ''}`;
    if (remainingMonths > 0) result += ` ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''}`;
    return result;
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
            <span className="text-gray-300">Loans</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Loan History</h1>
        </div>
        <Link href="/dashboard/loans/apply" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          <Plus className="h-4 w-4 mr-2" /> Apply for Loan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/10">
              <Banknote className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "white"}}>Active Loans</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>{stats.active}</h3>
            </div>
          </div>
        </div>
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "white"}}>Pending Applications</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>{stats.pending}</h3>
            </div>
          </div>
        </div>
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/10">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white" style={{color: "white"}}>Total Borrowed</p>
              <h3 className="text-lg font-semibold text-white" style={{color: "white"}}>
                {currencySymbol}{stats.totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white" style={{color: "white"}}>Your Loan Applications</h2>
        </div>

        {loans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Landmark className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white" style={{color: "white"}}>
                            {currencySymbol}{loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-500">{loan.interestRate}% APR</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white truncate max-w-[150px]" style={{color: "white"}} title={loan.purpose}>
                        {loan.purpose}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white" style={{color: "white"}}>{formatDuration(loan.durationMonths)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white" style={{color: "white"}}>
                        {currencySymbol}{loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(loan.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-400">{new Date(loan.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/loans/${loan._id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-800 mb-4">
              <FileText className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white" style={{color: "white"}}>No loans yet</h3>
            <p className="mt-1 text-sm text-white max-w-md mx-auto" style={{color: "white"}}>
              You haven&apos;t applied for any loans yet. Apply for a loan to get started.
            </p>
            <Link href="/dashboard/loans/apply" className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Apply for Loan
            </Link>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-[#111111] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>About Our Loans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Quick Approval</h4>
              <p className="text-xs text-gray-400 mt-1">Get a decision within hours</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Competitive Rates</h4>
              <p className="text-xs text-gray-400 mt-1">Low interest rates from 5% APR</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Flexible Terms</h4>
              <p className="text-xs text-gray-400 mt-1">Choose from 6 months to 5 years</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
