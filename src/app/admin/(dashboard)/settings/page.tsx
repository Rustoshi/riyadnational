'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
  User,
  Mail,
  Settings,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';

interface AdminProfile {
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  createdAt?: string;
}

export default function AdminSettingsPage() {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.admin) {
        setAdminProfile(data.data.admin);
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      support: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return colors[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] animate-pulse" />
        <div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] animate-pulse" />
        <div className="h-80 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Account Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your admin account and security preferences
        </p>
      </div>

      {/* Admin Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>{adminProfile?.name || 'Admin'}</CardTitle>
              <CardDescription>{adminProfile?.email || ''}</CardDescription>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadge(
                adminProfile?.role || 'admin'
              )}`}
            >
              {adminProfile?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
            </span>
          </div>
        </CardHeader>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg)]">
            <Mail className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Email</p>
              <p className="text-sm text-[var(--text-primary)]">{adminProfile?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg)]">
            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Last Login</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(adminProfile?.lastLogin)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[var(--text-muted)]" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your admin account password</CardDescription>
            </div>
          </div>
        </CardHeader>

        {passwordMessage && (
          <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--success-light)] text-[var(--success)] text-sm">
            {passwordMessage}
          </div>
        )}

        {passwordError && (
          <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--error-light)] text-[var(--error)] text-sm">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Password must be at least 8 characters long. Use a mix of letters, numbers, and special characters for a strong password.
          </p>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isChangingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Quick Links to Other Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[var(--text-muted)]" />
            <div>
              <CardTitle>Other Settings</CardTitle>
              <CardDescription>Manage platform configuration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="mt-4 space-y-2">
          <Link
            href="/admin/settings/app"
            className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--bg)] hover:bg-[var(--primary-light)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">App Settings</p>
                <p className="text-xs text-[var(--text-muted)]">Site name, email, currency, and maintenance mode</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
          </Link>

          <Link
            href="/admin/settings/payment"
            className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--bg)] hover:bg-[var(--primary-light)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Payment Settings</p>
                <p className="text-xs text-[var(--text-muted)]">Payment methods, fees, and limits</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
