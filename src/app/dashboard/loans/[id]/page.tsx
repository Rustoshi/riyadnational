'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Landmark, Clock, CheckCircle, XCircle, DollarSign,
  Loader2, Calendar, Percent, FileText, ArrowLeft, AlertCircle,
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
  remainingBalance: number;
  paymentProgress: number;
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  nextPaymentDate?: string;
}

export default function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currencySymbol = getUserCurrencySymbol(user?.currency || 'USD');

  useEffect(() => {
    const fetchLoan = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`/api/user/loans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLoan(data.data);
        } else {
          toast.error('Loan not found');
          router.push('/dashboard/loans');
        }
      } catch (error) {
        console.error('Failed to fetch loan:', error);
        toast.error('Failed to load loan details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoan();
  }, [id, router]);

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
            <Clock className="h-4 w-4 mr-1.5" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
            <CheckCircle className="h-4 w-4 mr-1.5" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
            <XCircle className="h-4 w-4 mr-1.5" /> Rejected
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
            <CheckCircle className="h-4 w-4 mr-1.5" /> Fully Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
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

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Loan Not Found</h2>
          <Link href="/dashboard/loans" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
            Back to Loans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <Link href="/dashboard/loans" className="text-gray-500 hover:text-blue-400">Loans</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Details</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-white" style={{color: "white"}}>Loan Details</h1>
          <Link href="/dashboard/loans" className="flex items-center text-gray-400 hover:text-blue-400">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Overview Card */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-200 text-sm">Loan Amount</p>
                    <h2 className="text-2xl font-bold text-white" style={{color: "white"}}>
                      {currencySymbol}{loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                </div>
                {getStatusBadge(loan.status)}
              </div>
            </div>

            <div className="p-6">
              {/* Progress Bar for Active Loans */}
              {loan.status === 'active' && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Payment Progress</span>
                    <span className="text-white" style={{color: "white"}}>{loan.paymentProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${loan.paymentProgress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-gray-500">
                      Paid: {currencySymbol}{loan.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-500">
                      Remaining: {currencySymbol}{(loan.remainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Loan Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Percent className="h-4 w-4 mr-1" /> Interest Rate
                  </div>
                  <p className="text-lg font-semibold text-white" style={{color: "white"}}>{loan.interestRate}% APR</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <Calendar className="h-4 w-4 mr-1" /> Duration
                  </div>
                  <p className="text-lg font-semibold text-white" style={{color: "white"}}>{formatDuration(loan.durationMonths)}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <DollarSign className="h-4 w-4 mr-1" /> Monthly Payment
                  </div>
                  <p className="text-lg font-semibold text-white" style={{color: "white"}}>
                    {currencySymbol}{loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-center text-gray-400 text-sm mb-1">
                    <DollarSign className="h-4 w-4 mr-1" /> Total Payable
                  </div>
                  <p className="text-lg font-semibold text-white" style={{color: "white"}}>
                    {currencySymbol}{loan.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>
              <FileText className="h-5 w-5 inline mr-2 text-blue-400" />
              Loan Purpose
            </h3>
            <p className="text-gray-300">{loan.purpose}</p>
          </div>

          {/* Status Info */}
          {loan.status === 'pending' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-yellow-400 mr-3 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-yellow-400">Application Under Review</h3>
                  <p className="text-gray-400 mt-1">
                    Your loan application is currently being reviewed by our team. This typically takes 1-3 business days.
                    You will be notified once a decision has been made.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loan.status === 'approved' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-blue-400 mr-3 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-blue-400">Loan Approved</h3>
                  <p className="text-gray-400 mt-1">
                    Congratulations! Your loan has been approved. The funds will be disbursed to your account shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loan.status === 'rejected' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="h-6 w-6 text-red-400 mr-3 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-red-400">Application Rejected</h3>
                  <p className="text-gray-400 mt-1">
                    Unfortunately, your loan application was not approved. Please contact support for more information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 shrink-0">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white" style={{color: "white"}}>Application Submitted</p>
                  <p className="text-xs text-gray-500">{new Date(loan.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {loan.approvedAt && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3 shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white" style={{color: "white"}}>Loan Approved</p>
                    <p className="text-xs text-gray-500">{new Date(loan.approvedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {loan.disbursedAt && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 shrink-0">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white" style={{color: "white"}}>Funds Disbursed</p>
                    <p className="text-xs text-gray-500">{new Date(loan.disbursedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {loan.status === 'paid' && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center mr-3 shrink-0">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white" style={{color: "white"}}>Loan Fully Paid</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Payment */}
          {loan.status === 'active' && loan.nextPaymentDate && (
            <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Next Payment</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">
                  {currencySymbol}{loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-gray-400 mt-2">
                  Due: {new Date(loan.nextPaymentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Principal</span>
                <span className="text-white" style={{color: "white"}}>
                  {currencySymbol}{loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Interest</span>
                <span className="text-white" style={{color: "white"}}>
                  {currencySymbol}{(loan.totalPayable - loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-800 pt-3 flex justify-between">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="text-white font-medium" style={{color: "white"}}>
                  {currencySymbol}{loan.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
