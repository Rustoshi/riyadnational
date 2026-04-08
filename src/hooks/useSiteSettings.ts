'use client';

import { useState, useEffect } from 'react';

export interface SiteSettings {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  siteAddress: string;
  currency: string;
  currencySymbol: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: '',
  siteEmail: '',
  sitePhone: '',
  siteAddress: '',
  currency: 'USD',
  currencySymbol: '$',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/settings');
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.data);
        } else {
          setError(data.error || 'Failed to fetch settings');
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
        setError('Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
