'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden fixed inset-0 w-full" style={{ backgroundColor: 'rgb(17 24 39)' }}>
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'rgb(31 41 55)',
            color: '#fff',
            border: '1px solid rgb(55 65 81)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: 'rgb(31 41 55)',
              color: '#fff',
              border: '1px solid #ef4444',
            },
          },
        }}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: 'rgb(17 24 39 / 0.8)' }}>
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
