/**
 * Dashboard Page (AgileMind Platform)
 * 
 * Main dashboard for all users
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser, useHasHydrated } from '@/lib/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, passwordChangeRequired } = useAuth();
  const user = useUser();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Wait for store to hydrate from localStorage before checking auth
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (passwordChangeRequired) {
      router.push('/auth/change-password');
    }
  }, [isAuthenticated, passwordChangeRequired, hasHydrated, router]);

  // Show loading state while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--am-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderBottomColor: 'var(--am-primary)' }}></div>
          <p style={{ color: 'var(--am-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      label: 'View Reports',
      description: 'All AI reports',
      path: '/reports',
      iconBg: 'var(--am-primary-50)',
      iconColor: 'var(--am-primary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Upload Reports',
      description: 'For RAG chatbot',
      path: '/reports/upload',
      iconBg: 'var(--am-accent-50)',
      iconColor: 'var(--am-accent)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      label: 'AI Chatbot',
      description: 'Chat with reports',
      path: '/chatbot',
      iconBg: 'var(--am-secondary-50)',
      iconColor: 'var(--am-secondary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Upload Transcript',
      description: 'Meeting transcripts',
      path: '/transcripts/upload',
      iconBg: 'var(--am-success-light)',
      iconColor: 'var(--am-success)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      description: 'Account settings',
      path: '/settings',
      iconBg: 'var(--am-bg)',
      iconColor: 'var(--am-text-secondary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'New Tasks',
      description: 'From brainstorming',
      path: '/new-tasks',
      iconBg: 'var(--am-accent-50)',
      iconColor: 'var(--am-accent-dark)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'Recurring Bugs',
      description: 'From retrospectives',
      path: '/recurring-bugs',
      iconBg: 'var(--am-error-light)',
      iconColor: 'var(--am-error)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  const adminActions = [
    {
      label: 'Users',
      description: 'Manage team',
      path: '/users',
      iconBg: 'var(--am-success-light)',
      iconColor: 'var(--am-success)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Invite User',
      description: 'Add member',
      path: '/users/invite',
      iconBg: 'var(--am-secondary-50)',
      iconColor: 'var(--am-secondary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      label: 'Roles',
      description: 'Permissions',
      path: '/roles',
      iconBg: 'var(--am-warning-light)',
      iconColor: 'var(--am-warning)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: 'Jira Integration',
      description: 'Connect Jira',
      path: '/integrations/jira',
      iconBg: 'var(--am-secondary-50)',
      iconColor: 'var(--am-secondary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
  ];

  const stats = [
    { label: 'Total Projects', value: '0', color: 'var(--am-primary)' },
    { label: 'Active Tasks', value: '0', color: 'var(--am-success)' },
    { label: 'Pending', value: '0', color: 'var(--am-warning)' },
    { label: 'Team Members', value: '1', color: 'var(--am-secondary)' },
  ];

  const renderActionCard = (action: typeof quickActions[0]) => (
    <button
      key={action.label}
      onClick={() => router.push(action.path)}
      className="p-5 rounded-2xl text-left transition-all duration-200 group"
      style={{
        backgroundColor: 'var(--am-bg-card)',
        border: '1px solid var(--am-border)',
        boxShadow: 'var(--am-shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--am-shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--am-shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: action.iconBg, color: action.iconColor }}>
          {action.icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--am-text-primary)' }}>{action.label}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--am-text-secondary)' }}>{action.description}</p>
        </div>
      </div>
    </button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--am-text-primary)' }}>Dashboard</h1>
          <p className="mt-2" style={{ color: 'var(--am-text-secondary)' }}>
            Welcome back, {user?.first_name || user?.email}!
          </p>
        </div>

        {/* Quick Actions - For All Users */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map(renderActionCard)}

          {/* Admin/Super Admin Quick Actions */}
          {(user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('ADMIN')) && (
            <>
              {adminActions.map(renderActionCard)}
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="p-5 rounded-2xl" style={{
              backgroundColor: 'var(--am-bg-card)',
              border: '1px solid var(--am-border)',
              boxShadow: 'var(--am-shadow-sm)',
            }}>
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3" style={{ backgroundColor: stat.color }}>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                    {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {index === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium truncate" style={{ color: 'var(--am-text-secondary)' }}>{stat.label}</dt>
                    <dd className="text-2xl font-bold" style={{ color: 'var(--am-text-primary)' }}>{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Recent Activity */}
        <div className="rounded-2xl" style={{
          backgroundColor: 'var(--am-bg-card)',
          border: '1px solid var(--am-border)',
          boxShadow: 'var(--am-shadow-sm)',
        }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--am-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--am-text-primary)' }}>Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12" style={{ color: 'var(--am-text-muted)' }}>
              <svg className="mx-auto h-12 w-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No recent activity</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-2xl p-6" style={{
          backgroundColor: 'var(--am-bg-card)',
          border: '1px solid var(--am-border)',
          boxShadow: 'var(--am-shadow-sm)',
        }}>
          <h3 className="text-lg font-semibold mb-5" style={{ color: 'var(--am-text-primary)' }}>Getting Started</h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Explore the Dashboard',
                desc: 'Get familiar with the navigation and features',
                link: null as string | null,
                linkLabel: '',
                showFor: [] as string[],
              },
              {
                step: 2,
                title: 'Create Your First Project',
                desc: 'Start managing your work efficiently',
                link: '/dashboard/projects',
                linkLabel: 'Go to Projects →',
                showFor: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
              },
              {
                step: 3,
                title: 'Invite Team Members',
                desc: 'Collaborate with your team',
                link: '/users/invite',
                linkLabel: 'Invite Users →',
                showFor: ['ADMIN', 'SUPER_ADMIN'],
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  backgroundColor: 'var(--am-primary-50)',
                  color: 'var(--am-primary)'
                }}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--am-text-primary)' }}>{item.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--am-text-secondary)' }}>{item.desc}</p>
                  {item.link && item.showFor.some(role => user?.roles?.includes(role)) && (
                    <button
                      onClick={() => router.push(item.link!)}
                      className="mt-1.5 text-sm font-semibold transition-colors"
                      style={{ color: 'var(--am-primary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--am-primary-dark)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--am-primary)'; }}
                    >
                      {item.linkLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
