'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;

  accountNumber?: string;
  accountType?: string;
  profilePhoto?: string;
  status: string;
  emailVerified: boolean;
  kycStatus: string;
  balance?: number;
  bitcoinBalance?: number;
  currency?: string;
  phone?: string;
  country?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  dateOfBirth?: string;
  withdrawalFee?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/about', '/contact', '/terms', '/privacy', '/pending-approval'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token might be expired, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('token', refreshData.data.token);
            localStorage.setItem('refreshToken', refreshData.data.refreshToken);

            // Retry fetching user
            const retryResponse = await fetch('/api/user/profile', {
              headers: {
                Authorization: `Bearer ${refreshData.data.token}`,
              },
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              setUser(retryData.data);
              setIsLoading(false);
              return;
            }
          }
        }

        // If refresh failed, clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.some(path =>
      pathname === path || pathname.startsWith('/reset-password/')
    );
    const isAdminPath = pathname.startsWith('/admin');
    const isDashboardPath = pathname.startsWith('/dashboard');

    if (!user && !isPublicPath && !isAdminPath) {
      // Not logged in and trying to access protected route
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      // Logged in and trying to access auth pages
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback((token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
