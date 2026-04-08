'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Landmark,
  Loader2,
  Lock,
  Zap,
  Clock,
  Globe2,
  ArrowLeft,
  CheckCircle,
  KeyRound,
} from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const features = [
  { icon: Lock, title: 'Secure Platform', description: 'Bank-grade security' },
  { icon: Zap, title: 'Fast Transfers', description: 'Instant payments' },
  { icon: Clock, title: '24/7 Access', description: 'Always available' },
  { icon: Globe2, title: 'Global Banking', description: 'Worldwide access' },
];

export default function ForgotPasswordPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-700 relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Animated Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-teal-400/25 rounded-full blur-3xl animate-float-reverse" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-white">{companyName}</span>
              <span className="block text-sm text-blue-300 font-medium">Bank</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-3" style={{ color: 'white' }}>Reset Password</h1>
          <h2 className="text-xl text-white mb-4 font-medium" style={{ color: 'white' }}>Recover your account</h2>

          {/* Description */}
          <p className="text-white text-base mb-10 leading-relaxed">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-600/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 border border-slate-500/40 hover:bg-slate-600/80 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-semibold">{feature.title}</p>
                  <p className="text-white text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold text-white">{companyName}</span>
                <span className="block text-xs text-blue-300 font-medium">Bank</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
            <p className="text-white text-sm">Recover your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white" style={{ color: 'white' }}>Forgot Password</h2>
                  <p className="text-white text-sm">We&apos;ll help you recover it</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2" style={{ color: 'white' }}>Check your email</h3>
                  <p className="text-white/70 text-sm mb-6" style={{ color: 'white' }}>
                    We&apos;ve sent password reset instructions to <span className="text-blue-400">{email}</span>
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-blue-400 hover:underline text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-white mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  {/* Back to Login */}
                  <div className="text-center pt-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-white/70 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
