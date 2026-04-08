'use client';

import { useState } from 'react';
import { X, Building2, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountInfoModal({ isOpen, onClose }: AccountInfoModalProps) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const accountDetails = [
    { label: 'Account Name', value: user?.name || '---', field: 'name' },
    { label: 'Account Number', value: user?.accountNumber || '---', field: 'accountNumber' },
    { label: 'Account Type', value: user?.accountType || 'Savings', field: 'accountType' },
    { label: 'Sort Code', value: '388130', field: 'sortCode' },
    { label: 'Payment Reference', value: user?.accountNumber || '---', field: 'reference' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal Content */}
        <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative">
          {/* Close Button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Bank Account Details</h3>
            <p className="mt-1 text-sm text-gray-500">{settings.siteName}</p>
            {settings.siteAddress && (
              <p className="text-xs text-gray-500">{settings.siteAddress}</p>
            )}
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-medium mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Account Details
            </p>
            <ul className="space-y-3">
              {accountDetails.map((detail) => (
                <li
                  key={detail.field}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3" />
                    <span className="text-sm text-gray-700">{detail.label}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium capitalize">{detail.value}</span>
                    <button
                      onClick={() => copyToClipboard(detail.value, detail.field)}
                      className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      {copiedField === detail.field ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Note */}
          <div className="flex items-start p-4 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Payment reference helps {settings.siteName} track payments faster. Please include it in wire transfer description.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
