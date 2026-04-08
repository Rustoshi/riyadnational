'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  admin?: {
    name: string;
    email: string;
    role: string;
  };
}

export function Topbar({ onMenuClick, admin }: TopbarProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Clear token and redirect
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 lg:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 h-9 pl-9 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-30 focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--error)] rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                  No new notifications
                </div>
              </div>
              <div className="p-3 border-t border-[var(--border)]">
                <Link
                  href="/admin/notifications"
                  className="block text-center text-sm text-[var(--primary)] hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {admin?.name || 'Admin'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {admin?.role || 'Administrator'}
              </p>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-[var(--text-muted)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-[var(--border)]">
                <p className="font-medium text-[var(--text-primary)]">{admin?.name || 'Admin'}</p>
                <p className="text-sm text-[var(--text-muted)]">{admin?.email || 'admin@example.com'}</p>
              </div>
              <div className="p-2">
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] rounded-[var(--radius-md)]"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] rounded-[var(--radius-md)]"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
              <div className="p-2 border-t border-[var(--border)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-light)] rounded-[var(--radius-md)]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
