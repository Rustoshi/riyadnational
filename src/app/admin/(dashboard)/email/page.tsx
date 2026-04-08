'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, User, Users, Globe, Filter, Mail } from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';

export default function EmailPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [emailType, setEmailType] = useState<'single' | 'multiple' | 'all' | 'filtered'>('single');
  const [formData, setFormData] = useState({ to: '', subject: '', message: '', userIds: '', filter: '' });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: { sentCount?: number; failedCount?: number } } | null>(null);

  // Get domain for display
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'domain.com';

  useEffect(() => {
    if (userId) setFormData((prev) => ({ ...prev, to: userId }));
  }, [userId]);

  const handleSend = async () => {
    // Validation
    if (!formData.subject.trim()) {
      setResult({ success: false, message: 'Please enter a subject' });
      return;
    }
    if (!formData.message.trim()) {
      setResult({ success: false, message: 'Please enter a message' });
      return;
    }
    if (emailType === 'single' && !formData.to.trim()) {
      setResult({ success: false, message: 'Please enter a recipient email or user ID' });
      return;
    }
    if (emailType === 'multiple' && !formData.userIds.trim()) {
      setResult({ success: false, message: 'Please enter user IDs' });
      return;
    }
    if (emailType === 'filtered' && !formData.filter) {
      setResult({ success: false, message: 'Please select a filter' });
      return;
    }

    setIsSending(true);
    setResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      const body: Record<string, unknown> = { 
        subject: formData.subject, 
        message: formData.message, 
        type: emailType 
      };
      
      if (emailType === 'single') body.to = formData.to;
      else if (emailType === 'multiple') body.userIds = formData.userIds.split(',').map((id) => id.trim()).filter(Boolean);
      else if (emailType === 'filtered') body.filter = formData.filter;

      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setResult({ 
          success: true, 
          message: data.message || 'Email sent successfully',
          details: data.data
        });
        // Clear form on success
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
      } else {
        setResult({ 
          success: false, 
          message: data.error || data.message || 'Failed to send email' 
        });
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to send email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const emailTypes = [
    { value: 'single', label: 'Single User', icon: User, description: 'Send to one user' },
    { value: 'multiple', label: 'Multiple Users', icon: Users, description: 'Send to selected users' },
    { value: 'all', label: 'All Users', icon: Globe, description: 'Send to everyone' },
    { value: 'filtered', label: 'Filtered Users', icon: Filter, description: 'Send by criteria' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Send Email</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Send emails to users from support@{domain}</p>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          result.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            result.success ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {result.success ? (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <p className="text-sm mt-1 opacity-80">
                Sent: {result.details.sentCount || 0}
                {result.details.failedCount ? `, Failed: ${result.details.failedCount}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Type</CardTitle>
          <CardDescription>Choose who to send the email to</CardDescription>
        </CardHeader>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {emailTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setEmailType(type.value as typeof emailType)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  emailType === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-[var(--border)] hover:border-blue-300 hover:bg-[var(--bg)]'
                }`}
              >
                <Icon className={`w-6 h-6 ${emailType === type.value ? 'text-blue-600' : 'text-[var(--text-muted)]'}`} />
                <p className={`mt-2 text-sm font-medium ${emailType === type.value ? 'text-blue-700' : 'text-[var(--text-primary)]'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{type.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>
            Emails will be sent from <span className="font-medium text-[var(--text-primary)]">support@{domain}</span>
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 mt-4">
          {emailType === 'single' && (
            <Input 
              label="Recipient Email or User ID" 
              value={formData.to} 
              onChange={(e) => setFormData({ ...formData, to: e.target.value })} 
              placeholder="user@example.com or user_id" 
            />
          )}
          {emailType === 'multiple' && (
            <div>
              <Input 
                label="User IDs (comma separated)" 
                value={formData.userIds} 
                onChange={(e) => setFormData({ ...formData, userIds: e.target.value })} 
                placeholder="507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012" 
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Enter MongoDB user IDs separated by commas
              </p>
            </div>
          )}
          {emailType === 'all' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                This will send an email to ALL registered users. Please make sure the content is appropriate for everyone.
              </p>
            </div>
          )}
          {emailType === 'filtered' && (
            <Select
              label="Filter Users By"
              options={[
                { value: '', label: 'Select a filter...' },
                { value: 'active', label: 'Active Users' },
                { value: 'inactive', label: 'Inactive Users' },
                { value: 'verified', label: 'Email Verified Users' },
                { value: 'unverified', label: 'Email Unverified Users' },
                { value: 'blocked', label: 'Blocked Users' },
                { value: 'suspended', label: 'Suspended Users' },
              ]}
              value={formData.filter}
              onChange={(e) => setFormData({ ...formData, filter: e.target.value })}
            />
          )}

          <Input 
            label="Subject" 
            value={formData.subject} 
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
            placeholder="Enter email subject" 
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your message here...

The email will be formatted with a professional template including:
• Site branding header
• Personalized greeting with user's name
• Your message content
• Support team signature"
              rows={10}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)]">
              <Mail className="w-4 h-4 inline mr-1" />
              From: support@{domain}
            </p>
            <Button 
              leftIcon={<Send className="w-4 h-4" />} 
              onClick={handleSend} 
              isLoading={isSending}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
