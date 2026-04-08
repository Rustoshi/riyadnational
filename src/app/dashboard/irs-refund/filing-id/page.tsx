'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, FileText, Hash, Info, MessageCircle,
  Loader2, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IrsRefund {
  _id: string;
  name: string;
  filingId?: string;
  status: string;
}

export default function FilingIdPage() {
  const router = useRouter();

  const [refund, setRefund] = useState<IrsRefund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filingId, setFilingId] = useState('');

  useEffect(() => {
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

            // If already has filing ID, redirect to track
            if (latestRefund.filingId) {
              router.push('/dashboard/irs-refund/track');
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
    fetchRefund();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!filingId.trim()) {
      toast.error('Please enter your filing ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      const res = await fetch('/api/user/irs-refunds/filing-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filingId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Filing ID updated successfully!');
        router.push('/dashboard/irs-refund/track');
      } else {
        toast.error(data.error || data.message || 'Failed to update filing ID');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <Link href="/dashboard/irs-refund" className="text-gray-500 hover:text-blue-400">IRS Refund</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Filing ID</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Enter Your Filing ID</h1>
        <p className="text-gray-400 mt-1">Please enter the filing ID provided by our support team</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Enter Your Filing ID</h2>
            <p className="text-gray-200 mt-1">This ID is required to process your refund</p>
          </div>
        </div>

        {/* Support Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Need a Filing ID?</h4>
              <p className="text-sm text-gray-400 mt-1">
                Please contact our support team to receive your filing ID. This ID is required to process your refund request.
              </p>
              <Link
                href="/dashboard/support"
                className="inline-flex items-center mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center" style={{color: "white"}}>
                <Hash className="h-5 w-5 text-blue-400 mr-2" /> Filing ID Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filing ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={filingId}
                    onChange={(e) => setFilingId(e.target.value)}
                    placeholder="Enter your filing ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Send className="h-5 w-5 mr-2" /> Submit Filing ID</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
