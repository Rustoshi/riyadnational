'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Activity,
  CreditCard,
  Send,
  Globe,
  Download,
  Receipt,
  History,
  Settings,
  HelpCircle,
  Landmark,
  ShieldCheck,
  LogOut,
  X,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Main Menu', items: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Activity },
    { name: 'Cards', href: '/dashboard/cards', icon: CreditCard },
  ]},
  { label: 'Transfers', items: [
    { name: 'Local Transfer', href: '/dashboard/transfer/local', icon: Send },
    { name: 'International Wire', href: '/dashboard/transfer/international', icon: Globe },
    { name: 'Deposit', href: '/dashboard/deposit', icon: Download },
  ]},
  { label: 'Services', items: [
    { name: 'Loan Request', href: '/dashboard/loans', icon: CreditCard },
    { name: 'IRS Tax Refund', href: '/dashboard/irs-refund', icon: Receipt },
  ]},
  { label: 'Account', items: [
    { name: 'Settings', href: '/dashboard/profile', icon: Settings },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
  ]},
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getKycStatusBadge = () => {
    const status = user?.kycStatus || 'pending';
    switch (status) {
      case 'approved':
        // Don't show anything when KYC is approved
        return null;
      case 'pending':
        return (
          <div className="flex items-center justify-center py-1 rounded-md bg-yellow-50 border border-yellow-100">
            <span className="text-xs text-yellow-800 font-medium flex items-center">
              <Clock className="h-3 w-3 mr-1" /> KYC Pending
            </span>
          </div>
        );
      default:
        return (
          <Link href="/dashboard/kyc" className="flex items-center justify-center py-1 rounded-md bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
            <span className="text-xs text-red-800 font-medium flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" /> Verify KYC
            </span>
          </Link>
        );
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shadow-sm transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: 'rgb(17 24 39)', borderRight: '1px solid rgb(31 41 55)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: '1px solid rgb(31 41 55)' }}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">{settings.siteName}</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="px-4 py-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#1a2332' }}>
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 mr-3">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-blue-400">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    ID: {user?.accountNumber || '---'}
                  </p>
                </div>
              </div>

              {/* KYC Status - Only show if not approved */}
              {user?.kycStatus !== 'approved' && (
                <div className="mb-3">
                  <Link href="/dashboard/kyc" className="flex items-center justify-center py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-colors">
                    <span className="text-xs text-red-400 font-medium flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" /> Verify KYC
                    </span>
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  href="/dashboard/profile"
                  className="flex-1 inline-flex justify-center items-center px-2.5 py-1.5 border border-gray-600 shadow-sm text-xs font-medium rounded text-gray-300 hover:bg-gray-700 transition-colors"
                  style={{ backgroundColor: '#2a3444' }}
                >
                  <User className="h-3 w-3 mr-1" /> Profile
                </Link>
                <button
                  onClick={logout}
                  className="flex-1 inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  <LogOut className="h-3 w-3 mr-1" /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 overflow-y-auto">
            {menuItems.map((section) => (
              <div key={section.label}>
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4" style={{ borderTop: '1px solid rgb(31 41 55)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-xs text-gray-500">Secure Banking</span>
              </div>
              <span className="text-xs text-gray-600">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
