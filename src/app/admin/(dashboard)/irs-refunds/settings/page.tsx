'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface IrsRefundSettings {
  _id: string;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingTime: number;
  instructions: string;
  enableRefunds: boolean;
  requireVerification: boolean;
}

export default function IrsRefundSettingsPage() {
  const [settings, setSettings] = useState<IrsRefundSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    minAmount: '0',
    maxAmount: '10000',
    processingFee: '0',
    processingTime: '5',
    instructions: '',
    enableRefunds: true,
    requireVerification: true,
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/irs-refunds/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setFormData({
          minAmount: data.data.minAmount?.toString() || '0',
          maxAmount: data.data.maxAmount?.toString() || '10000',
          processingFee: data.data.processingFee?.toString() || '0',
          processingTime: data.data.processingTime?.toString() || '5',
          instructions: data.data.instructions || '',
          enableRefunds: data.data.enableRefunds ?? true,
          requireVerification: data.data.requireVerification ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/irs-refunds/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minAmount: parseFloat(formData.minAmount),
          maxAmount: parseFloat(formData.maxAmount),
          processingFee: parseFloat(formData.processingFee),
          processingTime: parseInt(formData.processingTime),
          instructions: formData.instructions,
          enableRefunds: formData.enableRefunds,
          requireVerification: formData.requireVerification,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings updated successfully');
        setSettings(data.data);
      } else {
        alert(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/irs-refunds">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Refunds
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">IRS Refund Settings</h1>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Minimum Refund Amount ($)"
              type="number"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Maximum Refund Amount ($)"
              type="number"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Processing Fee (%)"
              type="number"
              value={formData.processingFee}
              onChange={(e) => setFormData({ ...formData, processingFee: e.target.value })}
              min="0"
              max="100"
              step="0.01"
              required
            />
            <Input
              label="Processing Time (Days)"
              type="number"
              value={formData.processingTime}
              onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })}
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Refund Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Enter instructions for users..."
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableRefunds"
                checked={formData.enableRefunds}
                onChange={(e) => setFormData({ ...formData, enableRefunds: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <label htmlFor="enableRefunds" className="text-sm text-[var(--text-primary)]">
                Enable IRS Refund Service
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requireVerification"
                checked={formData.requireVerification}
                onChange={(e) => setFormData({ ...formData, requireVerification: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <label htmlFor="requireVerification" className="text-sm text-[var(--text-primary)]">
                Require Filing ID Verification
              </label>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
