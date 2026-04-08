'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  PiggyBank, Shield, TrendingUp, Smartphone, Clock, CheckCircle2,
  ArrowRight, Users, Percent, Lock, Bell,
} from 'lucide-react';

const features = [
  { icon: Percent, title: 'High Interest Rates', description: 'Earn competitive interest rates on your savings with our high-yield accounts.' },
  { icon: Shield, title: 'FDIC Insured', description: 'Your deposits are protected up to $250,000 by the FDIC.' },
  { icon: Smartphone, title: 'Mobile Access', description: 'Manage your savings anytime, anywhere with our mobile app.' },
  { icon: Lock, title: 'Secure Banking', description: '256-bit encryption and multi-factor authentication protect your account.' },
  { icon: Bell, title: 'Goal Tracking', description: 'Set savings goals and track your progress with smart notifications.' },
  { icon: Clock, title: 'No Lock-in Period', description: 'Access your money whenever you need it with no penalties.' },
];

const accountTypes = [
  {
    name: 'Basic Savings',
    rate: '2.50%',
    minDeposit: '$0',
    features: ['No minimum balance', 'Free online banking', 'Mobile check deposit', 'ATM access'],
    popular: false,
  },
  {
    name: 'High-Yield Savings',
    rate: '3.75%',
    minDeposit: '$500',
    features: ['Higher interest rate', 'Free online banking', 'Mobile check deposit', 'Priority support'],
    popular: true,
  },
  {
    name: 'Premium Savings',
    rate: '4.25%',
    minDeposit: '$10,000',
    features: ['Best interest rate', 'Dedicated advisor', 'Premium rewards', 'Exclusive benefits'],
    popular: false,
  },
];

export default function SavingsPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium mb-6">
                  <PiggyBank className="w-4 h-4" />
                  Savings Account
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Grow Your Money With Confidence
                </h1>
                <p className="text-xl text-slate-300 mb-8">
                  Start saving today with competitive interest rates and flexible options designed to help you reach your financial goals faster.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Open Account
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                  <div className="text-center">
                    <p className="text-emerald-400 text-sm font-medium mb-2">High-Yield Savings APY</p>
                    <p className="text-6xl font-bold text-white mb-2">3.75%</p>
                    <p className="text-slate-400">Annual Percentage Yield</p>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>No monthly fees</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>FDIC insured up to $250,000</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>24/7 online access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-[var(--public-primary-soft)] text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Why Choose Our Savings Account?
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)] max-w-2xl mx-auto">
                Experience banking that puts your financial growth first.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 border border-[var(--public-border)] hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--public-text-secondary)]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Types */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Choose Your Savings Account
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)]">
                Find the perfect account for your savings goals.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {accountTypes.map((account, index) => (
                <div
                  key={index}
                  className={`relative bg-[var(--public-bg)] rounded-2xl p-8 border-2 ${
                    account.popular ? 'border-emerald-500' : 'border-[var(--public-border)]'
                  }`}
                >
                  {account.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">{account.name}</h3>
                    <p className="text-4xl font-bold text-emerald-500 mb-1">{account.rate}</p>
                    <p className="text-sm text-[var(--public-text-secondary)]">APY</p>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-[var(--public-text-secondary)]">Minimum Deposit</p>
                    <p className="text-lg font-semibold text-[var(--public-text-primary)]">{account.minDeposit}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {account.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-[var(--public-text-secondary)]">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                      account.popular
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-[var(--public-surface)] text-[var(--public-text-primary)] border border-[var(--public-border)] hover:bg-[var(--public-bg)]'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-emerald-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Growing Your Savings Today
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join thousands of customers who trust {companyName} with their savings.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all"
            >
              Open Your Account <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
