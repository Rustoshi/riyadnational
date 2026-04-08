'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';

interface AppSettings {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  siteAddress: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  maintenanceMode: boolean;
}

export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    siteName: '',
    siteEmail: '',
    sitePhone: '',
    siteAddress: '',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    maintenanceMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings?category=general', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data) {
        // Map from stored keys (app_siteName) to form fields (siteName)
        const mapped: Partial<AppSettings> = {};
        if (data.data.app_siteName) mapped.siteName = data.data.app_siteName;
        if (data.data.app_siteEmail) mapped.siteEmail = data.data.app_siteEmail;
        if (data.data.app_sitePhone) mapped.sitePhone = data.data.app_sitePhone;
        if (data.data.app_siteAddress) mapped.siteAddress = data.data.app_siteAddress;
        if (data.data.app_currency) mapped.currency = data.data.app_currency;
        if (data.data.app_currencySymbol) mapped.currencySymbol = data.data.app_currencySymbol;
        if (data.data.app_timezone) mapped.timezone = data.data.app_timezone;
        if (data.data.app_maintenanceMode !== undefined) mapped.maintenanceMode = data.data.app_maintenanceMode;
        setSettings(prev => ({ ...prev, ...mapped }));
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          type: 'app',
          siteName: settings.siteName,
          siteEmail: settings.siteEmail,
          sitePhone: settings.sitePhone,
          siteAddress: settings.siteAddress,
          currency: settings.currency,
          currencySymbol: settings.currencySymbol,
          timezone: settings.timezone,
          maintenanceMode: settings.maintenanceMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings saved successfully');
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-6"><div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">App Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Configure general application settings</p>
        </div>
        <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
      </div>

      {message && (
        <div className={`p-4 rounded-[var(--radius-md)] ${message.includes('success') ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--error-light)] text-[var(--error)]'}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>Basic information about your platform</CardDescription>
        </CardHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Site Name" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} placeholder="My Banking Platform" />
            <Input label="Site Email" type="email" value={settings.siteEmail} onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })} placeholder="support@example.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone Number" value={settings.sitePhone} onChange={(e) => setSettings({ ...settings, sitePhone: e.target.value })} placeholder="+1 234 567 8900" />
            <Input label="Address" value={settings.siteAddress} onChange={(e) => setSettings({ ...settings, siteAddress: e.target.value })} placeholder="123 Main St, City, Country" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Locale</CardTitle>
          <CardDescription>Configure currency and timezone settings</CardDescription>
        </CardHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Currency Code" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} placeholder="USD" />
            <Input label="Currency Symbol" value={settings.currencySymbol} onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })} placeholder="$" />
            <Input label="Timezone" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} placeholder="UTC" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>Enable to temporarily disable user access</CardDescription>
        </CardHeader>
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-[var(--text-primary)]">Enable maintenance mode</span>
          </label>
          <p className="mt-2 text-xs text-[var(--text-muted)]">When enabled, users will see a maintenance page instead of the normal site.</p>
        </div>
      </Card>
    </div>
  );
}
