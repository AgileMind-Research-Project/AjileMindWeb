'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser, useTenant } from '@/lib/store/auth.store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
}


export default function DashboardLayout({ children, mainClassName }: Readonly<DashboardLayoutProps>) {
  const { logout } = useAuth();
  const user = useUser();
  const tenant = useTenant();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar - Fixed */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">AgileMind</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{tenant?.company_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-right">
                <p className="font-medium text-gray-900">
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user?.email}
                </p>
                <div className="flex gap-1 justify-end">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role: string, index: number) => (
                      <span key={role} className="text-gray-500">
                        {role}{index < (user.roles?.length ?? 0) - 1 ? ',' : ''}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">{user?.role}</p>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - Below Navbar */}
      <div className="flex pt-16">
        <Sidebar />

        {/* Main Content */}

        <main className={`flex-1 ml-64 p-8 ${mainClassName || ''}`}>
          {children}
        </main>
      </div>
    </div >
  );
}
