'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Banknote, Clock, Percent, FileText, Shield, CheckCircle,
  Loader2, Home, Car, Briefcase, Users, CreditCard, Stethoscope, Info,
  DollarSign, Calendar, MessageSquare, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

const LOAN_TYPES = [
  { id: 'personal_home', name: 'Personal Home Loans', icon: Home, description: 'Finance your dream home' },
  { id: 'automobile', name: 'Automobile Loans', icon: Car, description: 'Flexible auto financing' },
  { id: 'business', name: 'Business Loans', icon: Briefcase, description: 'Grow your business' },
  { id: 'joint_mortgage', name: 'Joint Mortgage', icon: Users, description: 'Share with co-borrower' },
  { id: 'secured_overdraft', name: 'Secured Overdraft', icon: CreditCard, description: 'Asset-backed funds' },
  { id: 'health_finance', name: 'Health Finance', icon: Stethoscope, description: 'Medical expenses' },
];

const DURATION_OPTIONS = [
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
  { value: 24, label: '2 Years' },
  { value: 36, label: '3 Years' },
  { value: 48, label: '4 Years' },
  { value: 60, label: '5 Years' },
];

const INCOME_RANGES = [
  '$2,000 - $5,000',
  '$6,000 - $10,000',
  '$11,000 - $20,000',
  '$21,000 - $50,000',
  '$100,000 and above',
];

export default function ApplyLoanPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [isCheckingLoans, setIsCheckingLoans] = useState(true);

  const [formData, setFormData] = useState({
    amount: '',
    durationMonths: 12,
    loanType: '',
    purpose: '',
    income: '',
    termsAccepted: false,
  });

  const currencySymbol = getUserCurrencySymbol(user?.currency || 'USD');

  // Check for existing active/pending loans
  useEffect(() => {
    const checkLoans = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/user/loans?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const loans = data.data || [];
          const hasActive = loans.some((l: { status: string }) => 
            ['pending', 'approved', 'active'].includes(l.status)
          );
          setHasActiveLoan(hasActive);
        }
      } catch (error) {
        console.error('Failed to check loans:', error);
      } finally {
        setIsCheckingLoans(false);
      }
    };
    checkLoans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const calculateMonthlyPayment = () => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = 5 / 100 / 12; // 5% annual rate
    const months = formData.durationMonths;
    if (amount <= 0 || months <= 0) return 0;
    const payment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return isNaN(payment) ? 0 : payment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid loan amount');
      return;
    }
    if (!formData.purpose.trim()) {
      toast.error('Please describe the purpose of your loan');
      return;
    }
    if (!formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      const res = await fetch('/api/user/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          durationMonths: formData.durationMonths,
          purpose: `${formData.loanType ? formData.loanType + ': ' : ''}${formData.purpose}`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Loan application submitted successfully!');
        router.push('/dashboard/loans');
      } else {
        toast.error(data.error || data.message || 'Failed to submit loan application');
      }
    } catch (error) {
      console.error('Loan application error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingLoans) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
          <span className="text-gray-300">Apply</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Loan Services</h1>
      </div>

      {/* Active Loan Alert */}
      {hasActiveLoan && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex">
            <Info className="h-5 w-5 text-yellow-400 shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-400">Loan Application Restricted</h3>
              <p className="text-sm text-gray-400 mt-1">
                You currently have an active or pending loan. You cannot apply for a new loan until your current loan is completed.
              </p>
              <Link href="/dashboard/loans" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium mt-2 inline-block">
                View your loans →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      {!showForm && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{color: "white"}}>Loan Services</h2>
              <p className="text-gray-200 mt-1">Financial solutions to help you achieve your goals</p>
            </div>

            <div className="p-6 md:p-8">
              {/* Benefits */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4" style={{color: "white"}}>Why Choose Our Loans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] rounded-lg p-4 flex items-start">
                    <Clock className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Quick Approval</h4>
                      <p className="text-sm text-gray-400">Get a decision within hours</p>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 flex items-start">
                    <Percent className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Competitive Rates</h4>
                      <p className="text-sm text-gray-400">Low interest rates from 5% APR</p>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 flex items-start">
                    <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Simple Process</h4>
                      <p className="text-sm text-gray-400">Minimal paperwork required</p>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 flex items-start">
                    <Shield className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Secure & Confidential</h4>
                      <p className="text-sm text-gray-400">Bank-level security</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Types */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4" style={{color: "white"}}>Available Loan Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {LOAN_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.id} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center mb-2">
                          <Icon className="h-5 w-5 text-blue-400 mr-2" />
                          <h4 className="font-medium text-white" style={{color: "white"}}>{type.name}</h4>
                        </div>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How It Works */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4" style={{color: "white"}}>How It Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 shrink-0">
                      <span className="text-blue-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Apply Online</h4>
                      <p className="text-sm text-gray-400">Complete our simple application form</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 shrink-0">
                      <span className="text-blue-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Quick Review</h4>
                      <p className="text-sm text-gray-400">Our team reviews your application</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 shrink-0">
                      <span className="text-blue-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white" style={{color: "white"}}>Get Funded</h4>
                      <p className="text-sm text-gray-400">Funds transferred to your account</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2" style={{color: "white"}}>Ready to get started?</h3>
                <p className="text-gray-400 mb-4">Apply now and get a decision quickly</p>
                <button
                  onClick={() => setShowForm(true)}
                  disabled={hasActiveLoan}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    hasActiveLoan
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {hasActiveLoan ? (
                    <>Application Restricted</>
                  ) : (
                    <><FileText className="h-5 w-5 mr-2" /> Apply for a Loan</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showForm && !hasActiveLoan && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Loan Application Form</h2>
                  <p className="text-gray-200 text-sm">Complete the form below to apply</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              {/* Back Button */}
              <button type="button" onClick={() => setShowForm(false)} className="flex items-center text-gray-400 hover:text-blue-400 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Information
              </button>

              {/* Loan Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Loan Details</h3>
                <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5 space-y-5">
                  {/* Amount and Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Loan Amount ({user?.currency || 'USD'}) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="Enter amount"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-500" />
                        </div>
                        <select
                          name="durationMonths"
                          value={formData.durationMonths}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Loan Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Credit Facility</label>
                    <select
                      name="loanType"
                      value={formData.loanType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Loan Type (Optional)</option>
                      {LOAN_TYPES.map((type) => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Purpose of Loan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <MessageSquare className="h-5 w-5 text-gray-500" />
                      </div>
                      <textarea
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Describe the purpose of this loan..."
                        rows={4}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Financial Information</h3>
                <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Net Income</label>
                  <select
                    name="income"
                    value={formData.income}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#111111] border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Income Range</option>
                    {INCOME_RANGES.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loan Summary */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <h4 className="text-sm font-medium text-white mb-3" style={{color: "white"}}>Loan Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Loan Amount</p>
                      <p className="text-white font-medium" style={{color: "white"}}>{currencySymbol}{parseFloat(formData.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Interest Rate</p>
                      <p className="text-white font-medium" style={{color: "white"}}>5% APR</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Monthly Payment</p>
                      <p className="text-white font-medium" style={{color: "white"}}>{currencySymbol}{calculateMonthlyPayment().toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Payable</p>
                      <p className="text-white font-medium" style={{color: "white"}}>{currencySymbol}{(calculateMonthlyPayment() * formData.durationMonths).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-300">
                    I agree to the <Link href="#" className="text-blue-400 hover:underline">Terms and Conditions</Link> and understand that my application will be reviewed.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center transition-colors"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" /> Submit Application</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
