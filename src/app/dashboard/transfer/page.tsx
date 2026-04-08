'use client';

import Link from 'next/link';
import {
  Send,
  Globe,
  ChevronRight,
  ArrowRight,
  Shield,
} from 'lucide-react';

const transferOptions = [
  {
    title: 'Local Transfer',
    description: 'Send money to any local bank account within the country. Fast and secure domestic transfers.',
    href: '/dashboard/transfer/local',
    icon: Send,
    color: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    features: ['Same-day processing', 'Low fees', 'All local banks supported'],
  },
  {
    title: 'International Transfer',
    description: 'Transfer funds globally via wire transfer, cryptocurrency, PayPal, Wise, and more.',
    href: '/dashboard/transfer/international',
    icon: Globe,
    color: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    features: ['Multiple payment methods', 'Competitive rates', '150+ countries'],
  },
];

export default function TransferPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Transfer Funds</h1>
        <div className="flex items-center text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-white">Transfer</span>
        </div>
      </div>

      {/* Transfer Options */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transferOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="group rounded-xl overflow-hidden transition-all hover:ring-2 hover:ring-blue-500"
              style={{ backgroundColor: 'rgb(31 41 55)' }}
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl ${option.color} flex items-center justify-center`}>
                    <option.icon className={`h-7 w-7 ${option.iconColor}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2">{option.title}</h2>
                <p className="text-gray-400 text-sm mb-4">{option.description}</p>
                
                {/* Features */}
                <div className="space-y-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="px-6 py-4 border-t border-gray-700">
                <span className="text-blue-400 text-sm font-medium group-hover:underline">
                  Start Transfer →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-5 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">Secure Transfers</h3>
              <p className="text-xs text-gray-400 mt-1">
                All transfers are protected with bank-grade encryption. Your transaction PIN is required for every transfer to ensure maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <h4 className="text-sm font-medium text-white mb-1">Daily Limits</h4>
            <p className="text-xs text-gray-400">Check your daily transfer limits in account settings.</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <h4 className="text-sm font-medium text-white mb-1">Processing Time</h4>
            <p className="text-xs text-gray-400">Local transfers: Same day. International: 1-3 business days.</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <h4 className="text-sm font-medium text-white mb-1">Need Help?</h4>
            <p className="text-xs text-gray-400">Contact support for assistance with your transfers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
