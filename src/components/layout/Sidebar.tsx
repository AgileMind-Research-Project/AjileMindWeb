'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

interface SubMenuItem extends MenuItem {
  parent?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);

  const menuItems: MenuItem[] = [

    {
      label: 'Projects',
      path: '/dashboard/projects',
      roles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'My Tasks',
      path: '/my-tasks',
      roles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Notifications',
      path: '/dashboard/notifications',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      label: 'Admin Dashboard',
      path: '/dashboard/admin',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      label: 'Super Admin Dashboard',
      path: '/dashboard/super-admin',
      roles: ['SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      label: 'Send Downtime',
      path: '/dashboard/downtime',
      roles: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      label: 'Release Notes',
      path: '/dashboard/release-notes',
      roles: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'AgileMind Teams',
      path: '/dashboard/meetings',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    {
      label: 'Chat',
      path: '/chat',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      label: 'Transcripts',
      path: '/transcripts',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'Report Chatbot',
      path: '/chatbot',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      label: 'Tasks Updates',
      path: '/dashboard/tasks-updates',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      label: 'AI Reports',
      path: '/reports',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'Report Templates',
      path: '/reports/templates',
      roles: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      label: 'Project Events',
      path: '/dashboard/project-events',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  const dashboardSubMenuItems: SubMenuItem[] = [
    {
      label: 'Overview',
      path: '/dashboard',
      roles: ['USER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Risk Management',
      path: '/dashboard/risk-management',
      roles: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'Delay Management',
      path: '/dashboard/delay-management',
      roles: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Trust Index',
      path: '/dashboard/trust-index',
      roles: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      label: 'Project Events',
      path: '/dashboard/project-events',
      roles: ['USER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  // Helper function to normalize user roles
  const getUserRoles = (): string[] => {
    if (!user) return [];

    // If roles array exists and is valid
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles;
    }

    // Handle legacy role field
    if (user.role) {
      // Check if role is a stringified array (e.g., '["SUPER_ADMIN"]')
      if (typeof user.role === 'string' && user.role.startsWith('[')) {
        try {
          const parsed = JSON.parse(user.role);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          // Not valid JSON, treat as single role
        }
      }
      return [user.role];
    }

    return [];
  };

  // Filter menu items based on user roles
  const visibleMenuItems = menuItems.filter(item => {
    if (!user) return false;
    const userRoles = getUserRoles();
    return item.roles.some(role => userRoles.includes(role));
  });

  // Filter dashboard submenu items based on user roles
  const visibleDashboardSubMenuItems = dashboardSubMenuItems.filter(item => {
    if (!user) return false;
    const userRoles = getUserRoles();
    return item.roles.some(role => userRoles.includes(role));
  });



  return (
    <aside className="w-64 fixed left-0 top-16 bottom-0 flex flex-col overflow-hidden" style={{
      backgroundColor: 'var(--am-bg-sidebar)',
      borderRight: '1px solid var(--am-border)',
    }}>
      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Dashboard Collapsible Section - Always at top */}
        {visibleDashboardSubMenuItems.length > 0 && (
          <div className="mb-1">
            {/* Dashboard Header - Collapsible Trigger */}
            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200"
              style={{ color: 'var(--am-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--am-hover-bg)';
                e.currentTarget.style.color = 'var(--am-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--am-text-primary)';
              }}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="font-semibold text-sm">Dashboard</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isDashboardOpen ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dashboard Submenu Items */}
            {isDashboardOpen && (
              <div className="mt-1 ml-3 space-y-0.5 animate-fade-in">
                {visibleDashboardSubMenuItems.map((subItem) => {
                  const isActive = pathname === subItem.path;

                  return (
                    <Link
                      key={subItem.label + subItem.path}
                      href={subItem.path}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--am-primary-50)',
                              color: 'var(--am-primary)',
                              fontWeight: 600,
                              borderLeft: '3px solid var(--am-primary)',
                            }
                          : {
                              color: 'var(--am-text-secondary)',
                              borderLeft: '3px solid transparent',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--am-hover-bg)';
                          e.currentTarget.style.color = 'var(--am-primary)';
                          e.currentTarget.style.borderLeft = '3px solid var(--am-primary-200)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--am-text-secondary)';
                          e.currentTarget.style.borderLeft = '3px solid transparent';
                        }
                      }}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="my-2 mx-2" style={{ borderTop: '1px solid var(--am-border)' }}></div>

        {/* Other Menu Items */}
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label + item.path}
              href={item.path}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--am-primary-50)',
                      color: 'var(--am-primary)',
                      fontWeight: 600,
                      borderLeft: '3px solid var(--am-primary)',
                    }
                  : {
                      color: 'var(--am-text-primary)',
                      borderLeft: '3px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--am-hover-bg)';
                  e.currentTarget.style.color = 'var(--am-primary)';
                  e.currentTarget.style.borderLeft = '3px solid var(--am-primary-200)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--am-text-primary)';
                  e.currentTarget.style.borderLeft = '3px solid transparent';
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 
