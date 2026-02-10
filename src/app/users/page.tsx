/**
 * Users List Page
 * 
 * View and manage all users in the tenant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import * as rolesApi from '@/lib/api/roles.api';
import { UserPlus, ArrowLeft, Mail, Shield, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function UsersListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const currentUser = useUser();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission
    if (!currentUser?.roles?.includes('SUPER_ADMIN') && !currentUser?.roles?.includes('ADMIN')) {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, currentUser, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        authApi.listUsers(),
        rolesApi.getRoles()
      ]);

      console.log('Users response:', usersResponse);

      // Handle response format: { success: true, data: [...] }
      const usersData = usersResponse?.data?.data || usersResponse?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(rolesResponse);

      if (usersData.length === 0) {
        toast.info('No users found. Invite your first user to get started!');
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      await authApi.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      PROJECT_MANAGER: 'bg-green-100 text-green-800',
      SCRUM_MASTER: 'bg-yellow-100 text-yellow-800',
      DEVELOPER: 'bg-orange-100 text-orange-800',
      VIEWER: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id || '');
    setShowRoleModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await rolesApi.updateUserRole(selectedUser.user_id, { role_id: selectedRoleId });

      const newRole = roles.find(r => r.role_id === selectedRoleId);
      setUsers(users.map(u =>
        u.user_id === selectedUser.user_id
          ? { ...u, role_id: selectedRoleId, role: newRole?.role_name || u.role }
          : u
      ));

      toast.success('User role updated successfully!');
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => router.push('/users/invite')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Invite User
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No users found</p>
            <button
              onClick={() => router.push('/users/invite')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Invite Your First User
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Login</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'No name'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role: string) => (
                            <span key={role} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                              <Shield className="w-3 h-3" />
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Shield className="w-3 h-3" />
                            No roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Check if user has SUPER_ADMIN role */}
                        {user.roles && user.roles.includes('SUPER_ADMIN') ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500 italic">
                            <Shield className="w-3 h-3" />
                            Protected
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => openRoleModal(user)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Change role"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/users/${user.user_id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user.user_id !== currentUser?.user_id && !user.roles?.includes('SUPER_ADMIN') && (
                          <button
                            onClick={() => handleDeleteUser(user.user_id, user.email)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold">Change User Role</h2>
              <p className="text-sm text-gray-600 mt-1">
                Update role for {selectedUser.first_name} {selectedUser.last_name}
              </p>
            </div>
            <form onSubmit={handleUpdateRole} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Role *
                </label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.role_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${selectedRoleId === role.role_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        value={role.role_id}
                        checked={selectedRoleId === role.role_id}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="text-blue-600"
                      />
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{role.role_name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
