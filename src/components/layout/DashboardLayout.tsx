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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--am-bg)' }}>
      {/* Top Navigation Bar - Fixed */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        backgroundColor: 'var(--am-bg-navbar)',
        borderBottom: '1px solid var(--am-border)',
        boxShadow: 'var(--am-shadow-sm)'
      }}>
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--am-primary)' }}>
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--am-primary)' }}>AgileMind</h1>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--am-text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--am-accent)' }}></div>
                <span className="font-medium">{tenant?.company_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-right">
                <p className="font-semibold" style={{ color: 'var(--am-text-primary)' }}>
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user?.email}
                </p>
                <div className="flex gap-1.5 justify-end mt-0.5">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role: string, index: number) => (
                      <span key={role} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: 'var(--am-primary-50)',
                        color: 'var(--am-primary)'
                      }}>
                        {role}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: 'var(--am-text-muted)' }} className="text-xs">{user?.role}</p>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                style={{ color: 'var(--am-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--am-error-light)';
                  e.currentTarget.style.color = 'var(--am-error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--am-text-secondary)';
                }}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
