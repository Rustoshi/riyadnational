'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  TrendingUp, Shield, Clock, Calculator, CheckCircle2,
  ArrowRight, Users, Home, Car, GraduationCap, Briefcase,
} from 'lucide-react';

const loanTypes = [
  { icon: Home, title: 'Home Loans', description: 'Competitive rates for your dream home', rate: 'From 6.5% APR' },
  { icon: Car, title: 'Auto Loans', description: 'Finance your new or used vehicle', rate: 'From 5.9% APR' },
  { icon: GraduationCap, title: 'Student Loans', description: 'Invest in your education', rate: 'From 4.5% APR' },
  { icon: Briefcase, title: 'Business Loans', description: 'Grow your business with flexible financing', rate: 'From 7.5% APR' },
];

const features = [
  { icon: Calculator, title: 'Flexible Terms', description: 'Choose repayment terms that fit your budget, from 12 to 84 months.' },
  { icon: Clock, title: 'Quick Approval', description: 'Get a decision in as little as 24 hours with our streamlined process.' },
  { icon: Shield, title: 'No Hidden Fees', description: 'Transparent pricing with no prepayment penalties or hidden charges.' },
  { icon: TrendingUp, title: 'Competitive Rates', description: 'Low interest rates that save you money over the life of your loan.' },
];

export default function LoansPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-orange-900 via-red-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Personal & Business Loans
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Loans for Every Need
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Get the financing you need with competitive rates and flexible terms designed to fit your budget.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all"
            >
              <Users className="w-5 h-5 mr-2" />
              Apply for a Loan
            </Link>
          </div>
        </section>

        {/* Loan Types */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Our Loan Products
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)]">
                Find the right loan for your needs.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {loanTypes.map((loan, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 border border-[var(--public-border)] hover:shadow-lg transition-shadow text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                    <loan.icon className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{loan.title}</h3>
                  <p className="text-[var(--public-text-secondary)] text-sm mb-4">{loan.description}</p>
                  <p className="text-orange-500 font-semibold">{loan.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Why Choose Our Loans?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--public-primary-soft)] flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-[var(--public-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--public-text-secondary)] text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-orange-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Apply today and get a decision within 24 hours.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all"
            >
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
