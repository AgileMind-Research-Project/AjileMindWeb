/**
 * Settings Page
 * 
 * User settings and preferences management
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useIsAuthenticated, useHasHydrated } from '@/lib/store/auth.store';
import { 
  Lock, 
  User, 
  Bell, 
  Globe, 
  Shield,
  ChevronRight 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--am-bg)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: 'var(--am-primary)' }}></div>
      </div>
    );
  }

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: Lock,
          title: 'Change Password',
          description: 'Update your password to keep your account secure',
          action: () => router.push('/auth/change-password'),
          iconColor: 'var(--am-primary)',
          iconBg: 'var(--am-primary-50)',
          disabled: false,
        },
        {
          icon: User,
          title: 'Profile Settings',
          description: 'Manage your personal information',
          action: () => router.push('/profile'),
          iconColor: 'var(--am-secondary)',
          iconBg: 'var(--am-secondary-50)',
          disabled: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          title: 'Notifications',
          description: 'Configure notification preferences',
          action: () => {},
          iconColor: 'var(--am-warning)',
          iconBg: 'var(--am-warning-light)',
          disabled: true,
        },
        {
          icon: Globe,
          title: 'Language & Region',
          description: 'Set your language and timezone',
          action: () => {},
          iconColor: 'var(--am-success)',
          iconBg: 'var(--am-success-light)',
          disabled: true,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          title: 'Security Settings',
          description: 'Two-factor authentication and security options',
          action: () => {},
          iconColor: 'var(--am-error)',
          iconBg: 'var(--am-error-light)',
          disabled: true,
        },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--am-text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--am-text-secondary)' }}>Manage your account and preferences</p>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="rounded-2xl p-6" style={{
            backgroundColor: 'var(--am-bg-card)',
            border: '1px solid var(--am-border)',
            boxShadow: 'var(--am-shadow-sm)',
          }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--am-primary-50)' }}>
                <User className="w-8 h-8" style={{ color: 'var(--am-primary)' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold" style={{ color: 'var(--am-text-primary)' }}>
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email
                  }
                </h2>
                <p style={{ color: 'var(--am-text-secondary)' }}>{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role: string) => (
                      <span key={role} className="text-xs px-3 py-1 rounded-full font-semibold" style={{
                        backgroundColor: 'var(--am-primary-50)',
                        color: 'var(--am-primary)',
                      }}>
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--am-text-muted)' }}>No role assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="rounded-2xl overflow-hidden" style={{
              backgroundColor: 'var(--am-bg-card)',
              border: '1px solid var(--am-border)',
              boxShadow: 'var(--am-shadow-sm)',
            }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--am-border)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--am-text-primary)' }}>{group.title}</h3>
              </div>
              <div>
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    disabled={item.disabled}
                    className="w-full px-6 py-4 flex items-center gap-4 transition-all duration-200"
                    style={{
                      borderBottom: itemIndex < group.items.length - 1 ? '1px solid var(--am-border)' : 'none',
                      opacity: item.disabled ? 0.5 : 1,
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!item.disabled) {
                        e.currentTarget.style.backgroundColor = 'var(--am-hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.iconBg }}>
                      <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--am-text-primary)' }}>{item.title}</h4>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--am-text-secondary)' }}>{item.description}</p>
                      {item.disabled && (
                        <p className="text-xs italic mt-0.5" style={{ color: 'var(--am-text-muted)' }}>Coming soon</p>
                      )}
                    </div>
                    {!item.disabled && (
                      <ChevronRight className="w-5 h-5" style={{ color: 'var(--am-text-muted)' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Info */}
          <div className="rounded-xl p-4" style={{
            backgroundColor: 'var(--am-primary-50)',
            border: '1px solid var(--am-primary-100)',
          }}>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--am-primary)' }} />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--am-primary-darker)' }}>Account Security</h4>
                <p className="text-sm" style={{ color: 'var(--am-primary-dark)' }}>
                  Keep your account secure by regularly updating your password and enabling 
                  security features. We recommend changing your password every 90 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
