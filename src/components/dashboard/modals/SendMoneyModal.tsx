'use client';

import Link from 'next/link';
import { X, Send, User, Globe, Bitcoin, ChevronRight } from 'lucide-react';

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendMoneyModal({ isOpen, onClose }: SendMoneyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal Content */}
        <div
          className="inline-block align-bottom rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative"
          style={{ backgroundColor: 'rgb(31 41 55)' }}
        >
          {/* Close Button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              type="button"
              className="rounded-md text-gray-400 hover:text-white focus:outline-none transition-colors"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/20 mb-4">
              <Send className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-100">Send Money</h3>
            <p className="mt-1 text-sm text-gray-400">Swift and Secure Money Transfer</p>
          </div>

          {/* Transfer Options */}
          <div className="mt-6 space-y-3">
            {/* Local Transfer */}
            <Link
              href="/dashboard/transfer/local"
              onClick={onClose}
              className="block group"
            >
              <div
                className="flex items-center justify-between p-4 rounded-lg group-hover:bg-gray-600/50 transition-colors border border-gray-700"
                style={{ backgroundColor: 'rgb(55 65 81)' }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Local Transfer</h4>
                    <p className="text-sm text-gray-400">Easily send money locally</p>
                    <p className="text-xs text-gray-500">0% Handling charges</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* Bitcoin Transfer */}
            <Link
              href="/dashboard/transfer/bitcoin"
              onClick={onClose}
              className="block group"
            >
              <div
                className="flex items-center justify-between p-4 rounded-lg group-hover:bg-gray-600/50 transition-colors border border-gray-700"
                style={{ backgroundColor: 'rgb(55 65 81)' }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 bg-orange-500/20 rounded-full flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <Bitcoin className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Bitcoin Transfer</h4>
                    <p className="text-sm text-gray-400">Send Bitcoin instantly worldwide</p>
                    <p className="text-xs text-gray-500">Low fees, fast confirmation</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </Link>

            {/* International Wire Transfer */}
            <Link
              href="/dashboard/transfer/international"
              onClick={onClose}
              className="block group"
            >
              <div
                className="flex items-center justify-between p-4 rounded-lg group-hover:bg-gray-600/50 transition-colors border border-gray-700"
                style={{ backgroundColor: 'rgb(55 65 81)' }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">International Wire Transfer</h4>
                    <p className="text-sm text-gray-400">Wire transfer is executed under 72 hours</p>
                    <p className="text-xs text-gray-500">IBAN & SWIFT code required</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
