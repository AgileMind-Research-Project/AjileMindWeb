'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user has super admin access
  React.useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System-level administration and configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tenant Management</h3>
            <p className="text-gray-600 text-sm mb-4">Manage tenants and organizations</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Tenants →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health</h3>
            <p className="text-gray-600 text-sm mb-4">Monitor system performance and health</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Health →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Management</h3>
            <p className="text-gray-600 text-sm mb-4">Database administration tools</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage DB →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Configuration</h3>
            <p className="text-gray-600 text-sm mb-4">Configure API keys and integrations</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Configure API →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Logs</h3>
            <p className="text-gray-600 text-sm mb-4">View system audit logs and activity</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Logs →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup & Recovery</h3>
            <p className="text-gray-600 text-sm mb-4">Manage system backups</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Backups →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
