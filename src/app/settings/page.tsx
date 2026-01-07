/**
 * Settings Page
 * 
 * User settings and preferences management
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useIsAuthenticated, useHasHydrated } from '@/lib/store/auth.store';
import DocumentUpload from '@/components/ai/DocumentUpload';
import { 
  ArrowLeft, 
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          disabled: false,
        },
        {
          icon: User,
          title: 'Profile Settings',
          description: 'Manage your personal information',
          action: () => router.push('/profile'),
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100',
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
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          disabled: true,
        },
        {
          icon: Globe,
          title: 'Language & Region',
          description: 'Set your language and timezone',
          action: () => {},
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
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
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          disabled: true,
        },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email
                  }
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Role: <span className="font-medium">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Document Management</h2>
            <DocumentUpload />
          </div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{group.title}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    disabled={item.disabled}
                    className={`w-full px-6 py-4 flex items-center gap-4 transition-colors ${
                      item.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      {item.disabled && (
                        <p className="text-xs text-gray-500 mt-1 italic">Coming soon</p>
                      )}
                    </div>
                    {!item.disabled && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Account Security</h4>
                <p className="text-sm text-blue-800">
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
