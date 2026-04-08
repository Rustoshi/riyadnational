'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--public-primary)]/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-[var(--public-primary)]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-slate-400">Last updated: January 2024</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-[var(--public-bg)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[var(--public-surface)] rounded-2xl border border-[var(--public-border)] p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">1. Introduction</h2>
                    <p className="text-[var(--public-text-secondary)]">
                      {companyName} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our banking services, website, and mobile applications.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">2. Information We Collect</h2>
                    <p className="text-[var(--public-text-secondary)] mb-4">We collect information that you provide directly to us, including:</p>
                    <ul className="list-disc pl-6 text-[var(--public-text-secondary)] space-y-2">
                      <li>Personal identification information (name, email address, phone number)</li>
                      <li>Financial information (account numbers, transaction history)</li>
                      <li>Government-issued identification for verification purposes</li>
                      <li>Device and usage information when you access our services</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">3. How We Use Your Information</h2>
                    <p className="text-[var(--public-text-secondary)] mb-4">We use the information we collect to:</p>
                    <ul className="list-disc pl-6 text-[var(--public-text-secondary)] space-y-2">
                      <li>Provide, maintain, and improve our banking services</li>
                      <li>Process transactions and send related information</li>
                      <li>Verify your identity and prevent fraud</li>
                      <li>Communicate with you about products, services, and promotions</li>
                      <li>Comply with legal and regulatory requirements</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">4. Information Sharing</h2>
                    <p className="text-[var(--public-text-secondary)]">
                      We do not sell your personal information. We may share your information with third parties only in the following circumstances: with your consent, to comply with legal obligations, to protect our rights, or with service providers who assist in our operations.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">5. Data Security</h2>
                    <p className="text-[var(--public-text-secondary)]">
                      We implement industry-standard security measures including 256-bit encryption, multi-factor authentication, and regular security audits to protect your information from unauthorized access, alteration, or destruction.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">6. Your Rights</h2>
                    <p className="text-[var(--public-text-secondary)] mb-4">You have the right to:</p>
                    <ul className="list-disc pl-6 text-[var(--public-text-secondary)] space-y-2">
                      <li>Access and receive a copy of your personal data</li>
                      <li>Request correction of inaccurate information</li>
                      <li>Request deletion of your personal data</li>
                      <li>Opt-out of marketing communications</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">7. Contact Us</h2>
                    <p className="text-[var(--public-text-secondary)]">
                      If you have questions about this Privacy Policy, please contact us at{' '}
                      <a href={`mailto:${settings.siteEmail || 'privacy@example.com'}`} className="text-[var(--public-primary)] hover:underline">
                        {settings.siteEmail || 'privacy@example.com'}
                      </a>
                    </p>
                  </section>
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
