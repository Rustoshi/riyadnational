'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  Shield, Lock, Key, Smartphone, Eye, AlertTriangle,
  CheckCircle2, FileText, Users,
} from 'lucide-react';

const securityFeatures = [
  { icon: Lock, title: '256-bit Encryption', description: 'All data is encrypted using bank-level 256-bit SSL encryption.' },
  { icon: Key, title: 'Multi-Factor Authentication', description: 'Add an extra layer of security with SMS or authenticator app verification.' },
  { icon: Eye, title: 'Real-time Monitoring', description: 'Our systems monitor for suspicious activity 24/7 to protect your account.' },
  { icon: Smartphone, title: 'Biometric Login', description: 'Use fingerprint or face recognition for secure and convenient access.' },
  { icon: AlertTriangle, title: 'Fraud Alerts', description: 'Instant notifications for any unusual account activity.' },
  { icon: Shield, title: 'FDIC Insured', description: 'Your deposits are protected up to $250,000 by the FDIC.' },
];

const securityTips = [
  'Never share your password or PIN with anyone',
  'Use a unique, strong password for your banking account',
  'Enable two-factor authentication for added security',
  'Regularly monitor your account for unauthorized transactions',
  'Be cautious of phishing emails and suspicious links',
  'Keep your devices and apps updated with the latest security patches',
  'Use secure Wi-Fi networks when accessing your account',
  'Log out of your account when using shared devices',
];

export default function SecurityPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Security Center</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Your security is our top priority. Learn how we protect your account and what you can do to stay safe.
            </p>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-sm font-medium rounded-full mb-4">
                Bank-Level Security
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                How We Protect You
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)] max-w-2xl mx-auto">
                We use industry-leading security measures to keep your money and information safe.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
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

        {/* Security Tips */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 bg-[var(--public-primary-soft)] text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                  Stay Safe
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-6">
                  Security Best Practices
                </h2>
                <p className="text-lg text-[var(--public-text-secondary)] mb-8">
                  Follow these tips to help keep your account secure and protect yourself from fraud.
                </p>
                <ul className="space-y-4">
                  {securityTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[var(--public-text-secondary)]">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[var(--public-bg)] rounded-2xl p-8 border border-[var(--public-border)]">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--public-text-primary)] mb-4">
                  Report Suspicious Activity
                </h3>
                <p className="text-[var(--public-text-secondary)] mb-6">
                  If you notice any unauthorized transactions or suspicious activity on your account, contact us immediately.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-[var(--public-surface)] rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[var(--public-primary-soft)] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[var(--public-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--public-text-secondary)]">Fraud Hotline</p>
                      <p className="text-[var(--public-text-primary)] font-semibold">1-800-FRAUD-HELP</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="mt-6 block w-full py-3 text-center bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                >
                  Contact Security Team
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-emerald-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Your Security Matters to Us
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join {companyName} and experience banking with peace of mind.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all"
            >
              <Users className="w-5 h-5 mr-2" />
              Open Secure Account
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
