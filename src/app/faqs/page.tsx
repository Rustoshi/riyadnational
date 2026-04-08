'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQsPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: `What is ${companyName}?`,
      answer: `${companyName} is a full-service financial institution that provides a wide range of banking services including savings accounts, checking accounts, loans, credit cards, and investment services. We are committed to helping our customers achieve their financial goals through personalized service and competitive rates.`,
    },
    {
      question: 'What Is a Bank Account?',
      answer: 'A bank account is a financial account maintained by a bank or other financial institution in which the financial transactions between the bank and a customer are recorded. It allows you to safely store your money, make deposits and withdrawals, and conduct various financial transactions.',
    },
    {
      question: 'How do I create my account?',
      answer: 'Registration process is very easy and will take a few moments to complete. Simply click the "Open Account" button on our website and fill in all the required fields including your personal information, contact details, and identification documents. Once submitted, our team will review your application and you\'ll receive confirmation within 24-48 hours.',
    },
    {
      question: `How long does my deposit take before it can reflect on my ${companyName} account dashboard?`,
      answer: 'Your deposit will be reflected immediately once it is confirmed on the blockchain network for cryptocurrency deposits. For bank transfers, it typically takes 1-3 business days depending on your bank. Wire transfers are usually processed within 24 hours.',
    },
    {
      question: 'What Are The Requirements For a Business Loan?',
      answer: 'To apply for a business loan, you\'ll need to provide: proof of business ownership, business financial statements, bank account statements, a valid business license, and personal identification. The specific requirements may vary based on the loan amount and type. Our loan officers are available to guide you through the process.',
    },
    {
      question: 'How long does it take to process a withdrawal to an international bank?',
      answer: 'Once we receive your withdrawal request, we process it immediately and send it to your bank account. International wire transfers typically take 3-5 business days to arrive, depending on the receiving bank and country. Some countries may have additional processing times due to local banking regulations.',
    },
    {
      question: 'Can I have more than two accounts?',
      answer: 'We do not allow multiple personal accounts except for business purposes. If you need a business account in addition to your personal account, please contact our support team to discuss your requirements and we\'ll help you set up the appropriate accounts.',
    },
    {
      question: 'How secure is my money with you?',
      answer: `Your security is our top priority. ${companyName} uses bank-level 256-bit encryption, multi-factor authentication, and advanced fraud detection systems to protect your accounts. We are also FDIC insured, meaning your deposits are protected up to $250,000.`,
    },
    {
      question: 'What are your customer service hours?',
      answer: 'Our customer service team is available 24/7 to assist you. You can reach us via phone, email, or live chat. For urgent matters, we recommend calling our dedicated support line for immediate assistance.',
    },
    {
      question: 'How do I reset my password?',
      answer: 'To reset your password, click on the "Forgot Password" link on the login page. Enter your registered email address, and we\'ll send you a secure link to create a new password. For security reasons, this link expires after 24 hours.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">FAQ</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Frequently Asked Questions
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">FAQs</span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-[var(--public-primary-soft)] text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                Help Center
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)]">
                Have any questions? We&apos;re here to help.
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl border border-[var(--public-border)] overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--public-bg)] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--public-primary-soft)] flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-[var(--public-primary)]" />
                      </div>
                      <span className="font-semibold text-[var(--public-text-primary)]">{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[var(--public-text-secondary)] transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-6">
                      <div className="pl-14">
                        <p className="text-[var(--public-text-secondary)]">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--public-primary-soft)] flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-[var(--public-primary)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--public-text-primary)] mb-4">
              Still have questions?
            </h2>
            <p className="text-lg text-[var(--public-text-secondary)] mb-8">
              Can&apos;t find the answer you&apos;re looking for? Please contact our friendly team.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
