/**
 * Dashboard Page (AgileMind Platform)
 * 
 * Main dashboard for super admin and users
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser, useTenant, useHasHydrated } from '@/lib/store/auth.store';
import { Users, UserPlus, Shield, LayoutDashboard, Settings, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { logout, isAuthenticated, passwordChangeRequired } = useAuth();
  const user = useUser();
  const tenant = useTenant();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  const isSuperAdminOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">AgileMind</h1>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="font-medium">{tenant?.company_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user?.email}
                </p>
                <p className="text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || user?.email}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your projects today.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dashboard</h3>
                <p className="text-sm text-gray-600">Overview</p>
              </div>
            </div>
          </button>

          {isSuperAdminOrAdmin && (
            <>
              <button
                onClick={() => router.push('/users')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Users</h3>
                    <p className="text-sm text-gray-600">Manage team</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/users/invite')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Invite User</h3>
                    <p className="text-sm text-gray-600">Add member</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/roles')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Roles</h3>
                    <p className="text-sm text-gray-600">Permissions</p>
                  </div>
                </div>
              </button>
            </>
          )}

          <button
            onClick={() => router.push('/settings')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Account & Preferences</p>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-2">No projects yet</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Team Members</h3>
            <p className="text-3xl font-bold text-gray-900">1</p>
            <p className="text-sm text-gray-500 mt-2">Start inviting users</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-2">Create your first task</p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Invite Your Team</h4>
                <p className="text-gray-600 text-sm">
                  Start by inviting team members to collaborate on projects.
                </p>
                {isSuperAdminOrAdmin && (
                  <button
                    onClick={() => router.push('/users/invite')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Invite Users →
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Create a Project</h4>
                <p className="text-gray-600 text-sm">
                  Set up your first project and start planning sprints.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Start Tracking Tasks</h4>
                <p className="text-gray-600 text-sm">
                  Add tasks to your backlog and assign them to team members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
