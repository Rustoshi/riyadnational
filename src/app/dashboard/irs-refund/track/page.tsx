'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Activity, Check, Search, CheckCircle, XCircle, Clock,
  Loader2, MessageCircle, RefreshCw, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IrsRefund {
  _id: string;
  name: string;
  filingId?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TrackRefundPage() {
  const router = useRouter();

  const [refund, setRefund] = useState<IrsRefund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRefund = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/user/irs-refunds?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const refunds = data.data || [];
        if (refunds.length > 0) {
          const latestRefund = refunds[0];
          setRefund(latestRefund);

          // If no filing ID, redirect to filing-id page
          if (!latestRefund.filingId) {
            router.push('/dashboard/irs-refund/filing-id');
            return;
          }
        } else {
          // No refund request, redirect to main page
          router.push('/dashboard/irs-refund');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch refund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchRefund();
    toast.success('Status refreshed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!refund) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'processed':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <Link href="/dashboard/irs-refund" className="text-gray-500 hover:text-blue-400">IRS Refund</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Track</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Track Your IRS Tax Refund</h1>
        <p className="text-gray-400 mt-1">Monitor the status of your refund request in real-time</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Track Your IRS Tax Refund</h2>
            <p className="text-gray-200 mt-1">View the progress of your refund request</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mb-6">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-700"></div>

            {/* Status Steps */}
            <div className="space-y-8">
              {/* Submitted Step */}
              <div className="relative flex items-start">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center z-10">
                  <Check className="h-4 w-4 text-blue-400" />
                </div>
                <div className="ml-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white" style={{color: "white"}}>Request Submitted</h3>
                    <span className="text-sm text-gray-500">{new Date(refund.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Your refund request has been successfully submitted</p>
                </div>
              </div>

              {/* Under Review Step */}
              <div className="relative flex items-start">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  ['pending', 'approved', 'rejected', 'processed'].includes(refund.status)
                    ? 'bg-blue-500/20'
                    : 'bg-gray-700'
                }`}>
                  <Search className={`h-4 w-4 ${
                    ['pending', 'approved', 'rejected', 'processed'].includes(refund.status)
                      ? 'text-blue-400'
                      : 'text-gray-500'
                  }`} />
                </div>
                <div className="ml-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white" style={{color: "white"}}>Under Review</h3>
                    <span className="text-sm text-gray-500">
                      {refund.status === 'pending' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Our team is reviewing your request and verifying your information</p>
                </div>
              </div>

              {/* Decision Step */}
              <div className="relative flex items-start">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  ['approved', 'rejected', 'processed'].includes(refund.status)
                    ? refund.status === 'rejected' ? 'bg-red-500/20' : 'bg-green-500/20'
                    : 'bg-gray-700'
                }`}>
                  {refund.status === 'rejected' ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : ['approved', 'processed'].includes(refund.status) ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="ml-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white" style={{color: "white"}}>Decision</h3>
                    <span className="text-sm text-gray-500">
                      {refund.status === 'pending' ? 'Pending' : refund.status === 'approved' ? 'Approved' : refund.status === 'processed' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {refund.status === 'pending' && 'Waiting for review completion'}
                    {refund.status === 'approved' && 'Your refund request has been approved'}
                    {refund.status === 'processed' && 'Your refund request has been approved and processed'}
                    {refund.status === 'rejected' && 'Your refund request has been rejected'}
                  </p>
                </div>
              </div>

              {/* Processing Step (only for approved) */}
              {['approved', 'processed'].includes(refund.status) && (
                <div className="relative flex items-start">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    refund.status === 'processed' ? 'bg-green-500/20' : 'bg-blue-500/20'
                  }`}>
                    {refund.status === 'processed' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                  <div className="ml-12">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white" style={{color: "white"}}>
                        {refund.status === 'processed' ? 'Refund Processed' : 'Processing Refund'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {refund.status === 'processed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {refund.status === 'processed'
                        ? 'Your refund has been processed and credited to your account'
                        : 'Your refund is being processed and will be credited to your account soon'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refund Details */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Refund Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Request ID</p>
              <p className="text-lg font-semibold text-white" style={{color: "white"}}>{refund._id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Filing ID</p>
              <p className="text-lg font-semibold text-white" style={{color: "white"}}>{refund.filingId || 'N/A'}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Submission Date</p>
              <p className="text-lg font-semibold text-white" style={{color: "white"}}>{new Date(refund.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status)}`}>
                {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
              </span>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4 md:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="text-lg font-semibold text-white" style={{color: "white"}}>{new Date(refund.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Admin Notes (if rejected) */}
        {refund.status === 'rejected' && refund.adminNotes && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex">
              <Info className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-400">Rejection Reason</h4>
                <p className="text-sm text-gray-400 mt-1">{refund.adminNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 flex items-center">
              <Info className="h-4 w-4 mr-1" /> Need help? Contact our support team
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/support"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Contact Support
              </Link>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
