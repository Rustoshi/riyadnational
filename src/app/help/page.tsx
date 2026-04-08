'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  HelpCircle, CreditCard, Wallet, Lock, Send, Phone,
  MessageCircle, FileText, Search, ArrowRight, ChevronRight,
} from 'lucide-react';

const helpCategories = [
  { icon: Wallet, title: 'Account Management', description: 'Learn how to manage your accounts, update settings, and more.', href: '/faqs' },
  { icon: CreditCard, title: 'Cards & Payments', description: 'Information about debit cards, credit cards, and payments.', href: '/faqs' },
  { icon: Send, title: 'Transfers & Transactions', description: 'How to send money, view transactions, and manage transfers.', href: '/faqs' },
  { icon: Lock, title: 'Security & Privacy', description: 'Keep your account secure and learn about our privacy practices.', href: '/security' },
  { icon: FileText, title: 'Loans & Credit', description: 'Information about loan applications and credit services.', href: '/services/loans' },
  { icon: HelpCircle, title: 'General Questions', description: 'Answers to frequently asked questions about our services.', href: '/faqs' },
];

const quickLinks = [
  { title: 'Reset Password', href: '/forgot-password' },
  { title: 'Contact Support', href: '/contact' },
  { title: 'View FAQs', href: '/faqs' },
  { title: 'Security Tips', href: '/security' },
];

export default function HelpPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--public-primary)]/20 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-[var(--public-primary)]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Help Center</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Find answers to your questions and get the support you need.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--public-primary)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--public-text-primary)] mb-4">
                How Can We Help You?
              </h2>
              <p className="text-[var(--public-text-secondary)]">
                Browse our help topics or search for specific information.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 border border-[var(--public-border)] hover:shadow-lg hover:border-[var(--public-primary)]/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--public-primary-soft)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <category.icon className="w-6 h-6 text-[var(--public-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2 flex items-center">
                    {category.title}
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-[var(--public-text-secondary)] text-sm">{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links & Contact */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Quick Links */}
              <div>
                <h3 className="text-2xl font-bold text-[var(--public-text-primary)] mb-6">Quick Links</h3>
                <div className="space-y-3">
                  {quickLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="flex items-center justify-between p-4 bg-[var(--public-bg)] rounded-xl border border-[var(--public-border)] hover:border-[var(--public-primary)]/50 transition-colors"
                    >
                      <span className="text-[var(--public-text-primary)] font-medium">{link.title}</span>
                      <ArrowRight className="w-5 h-5 text-[var(--public-primary)]" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact Support */}
              <div>
                <h3 className="text-2xl font-bold text-[var(--public-text-primary)] mb-6">Need More Help?</h3>
                <div className="bg-[var(--public-bg)] rounded-2xl p-6 border border-[var(--public-border)]">
                  <p className="text-[var(--public-text-secondary)] mb-6">
                    Can&apos;t find what you&apos;re looking for? Our support team is here to help you 24/7.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--public-primary-soft)] flex items-center justify-center">
                        <Phone className="w-6 h-6 text-[var(--public-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--public-text-secondary)]">Call Us</p>
                        <p className="text-[var(--public-text-primary)] font-semibold">+1 (800) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--public-primary-soft)] flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-[var(--public-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--public-text-secondary)]">Live Chat</p>
                        <p className="text-[var(--public-text-primary)] font-semibold">Available 24/7</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="mt-6 block w-full py-3 text-center bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
