'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Landmark,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Zap,
  Clock,
  Globe2,
  LogIn,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: Lock, title: 'Secure Platform', description: 'Bank-grade security' },
  { icon: Zap, title: 'Fast Transfers', description: 'Instant payments' },
  { icon: Clock, title: '24/7 Access', description: 'Always available' },
  { icon: Globe2, title: 'Global Banking', description: 'Worldwide access' },
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSiteSettings();
  const { login } = useAuth();
  const companyName = settings.siteName;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Check if user just registered
  const justRegistered = searchParams.get('registered') === 'true';

  const updateFormData = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (apiError) setApiError('');
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens and update auth state
      if (data.data?.token) {
        login(data.data.token, data.data.refreshToken);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Login failed');
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
          <h1 className="text-4xl font-bold text-white mb-3" style={{ color: 'white' }}>Welcome Back</h1>
          <h2 className="text-xl text-white mb-4 font-medium" style={{ color: 'white' }}>Sign in to your account</h2>

          {/* Description */}
          <p className="text-white text-base mb-10 leading-relaxed">
            Access your accounts, manage transfers, and stay in control of your finances with {companyName}.
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
            <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-white text-sm">Sign in to your account</p>
          </div>

          {/* Success Message */}
          {justRegistered && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 mb-6 rounded-xl text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Account created successfully! Please sign in.
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 mb-6 rounded-xl text-sm">
              {apiError}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white" style={{ color: 'white' }}>Sign In</h2>
                  <p className="text-white text-sm">Enter your credentials</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm text-white mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
                      placeholder="john@example.com"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-white mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
