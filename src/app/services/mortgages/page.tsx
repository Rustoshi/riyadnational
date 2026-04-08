'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  Home, Shield, Calculator, Clock, CheckCircle2,
  ArrowRight, Users, Key, Percent, FileText,
} from 'lucide-react';

const mortgageTypes = [
  { title: 'Fixed-Rate Mortgage', rate: 'From 6.25%', description: 'Predictable monthly payments with a locked-in interest rate.' },
  { title: 'Adjustable-Rate Mortgage', rate: 'From 5.75%', description: 'Lower initial rates that adjust over time.' },
  { title: 'FHA Loans', rate: 'From 5.99%', description: 'Government-backed loans with lower down payment requirements.' },
  { title: 'VA Loans', rate: 'From 5.50%', description: 'Special financing for veterans and active military.' },
];

const features = [
  { icon: Percent, title: 'Competitive Rates', description: 'Some of the lowest mortgage rates in the industry.' },
  { icon: Calculator, title: 'Flexible Terms', description: 'Choose from 15, 20, or 30-year loan terms.' },
  { icon: Clock, title: 'Fast Closing', description: 'Close on your home in as little as 21 days.' },
  { icon: FileText, title: 'Easy Application', description: 'Simple online application with minimal paperwork.' },
];

export default function MortgagesPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#004B87] via-teal-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
              <Home className="w-4 h-4" />
              Home Mortgages
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Your Dream Home
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Get the keys to your new home with competitive mortgage rates and personalized service.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all"
            >
              <Key className="w-5 h-5 mr-2" />
              Get Pre-Approved
            </Link>
          </div>
        </section>

        {/* Mortgage Types */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Mortgage Options
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)]">
                Find the right mortgage for your situation.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mortgageTypes.map((mortgage, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 border border-[var(--public-border)] hover:shadow-lg transition-shadow"
                >
                  <Home className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{mortgage.title}</h3>
                  <p className="text-blue-500 font-semibold mb-2">{mortgage.rate}</p>
                  <p className="text-[var(--public-text-secondary)] text-sm">{mortgage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--public-text-secondary)] text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Buy Your Home?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get pre-approved in minutes and start house hunting today.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
