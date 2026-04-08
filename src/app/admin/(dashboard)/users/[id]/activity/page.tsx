'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  Monitor,
  Globe,
  Clock,
} from 'lucide-react';
import {
  Card,
  Button,
  ConfirmDialog,
} from '@/components/ui';

interface Activity {
  _id: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function UserLoginActivityPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [userId]);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/login-activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data.activities || []);
        setUser(data.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearActivity = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/login-activity`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowClearDialog(false);
        setActivities([]);
      }
    } catch (error) {
      console.error('Clear activity failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'text-green-600 bg-green-100';
      case 'logout':
        return 'text-blue-600 bg-blue-100';
      case 'login_failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login':
        return 'Logged In';
      case 'logout':
        return 'Logged Out';
      case 'login_failed':
        return 'Login Failed';
      default:
        return action;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--surface)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--surface)] rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/users/${userId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to User
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Login Activity
            </h1>
            {user && (
              <p className="text-sm text-[var(--text-muted)]">
                {user.name} ({user.email})
              </p>
            )}
          </div>
        </div>

        {activities.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setShowClearDialog(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Clear Activity
          </Button>
        )}
      </div>

      {/* Activity List */}
      <Card>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-muted)]">No login activity found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activities.map((activity) => (
              <div key={activity._id} className="py-4 flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getActionColor(activity.action)}`}>
                      {getActionLabel(activity.action)}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                    {activity.ipAddress && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span>{activity.ipAddress}</span>
                      </div>
                    )}
                    {activity.userAgent && (
                      <div className="flex items-center gap-1 truncate max-w-md">
                        <Monitor className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{activity.userAgent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Clear Activity Dialog */}
      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearActivity}
        title="Clear Login Activity"
        message="Are you sure you want to clear all login activity for this user? This action cannot be undone."
        confirmText="Clear Activity"
        variant="danger"
        isLoading={isProcessing}
      />
    </div>
  );
}
