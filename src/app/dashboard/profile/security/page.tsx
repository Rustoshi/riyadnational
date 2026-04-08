'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Shield, Lock, Key, CheckCircle, Eye, EyeOff,
  Info, AlertTriangle, Loader2, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecuritySettingsPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Password updated successfully! Please login again.');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{color: "white"}}>Security Settings</h1>
        <div className="flex items-center text-sm mt-1">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <Link href="/dashboard/profile" className="text-gray-500 hover:text-blue-400">Settings</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Security</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center" style={{color: "white"}}>
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Change Password
            </h2>
            <p className="text-sm text-gray-500 mt-1">Update your account password to maintain security</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                    className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                    className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Password Requirements
                </h4>
                <p className="text-sm text-gray-400 mb-3">Ensure that these requirements are met:</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-400">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    Minimum 6 characters long - the more, the better
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    At least one lowercase character
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    At least one uppercase character
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    At least one number
                  </li>
                </ul>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-400">Security Reminder</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      After changing your password, you&apos;ll be required to log in again with your new credentials.
                      Make sure to remember your new password or store it in a secure password manager.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Updating...</>
                ) : (
                  <><Save className="h-5 w-5 mr-2" /> Change Password</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
