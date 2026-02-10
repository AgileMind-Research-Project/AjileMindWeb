/**
 * Roles Management Page
 * 
 * Create and manage roles (Super Admin only)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useHasHydrated, useIsAuthenticated } from '@/lib/store/auth.store';
import { Shield, Plus, Edit2, Trash2, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import * as rolesApi from '@/lib/api/roles.api';

interface Role {
  role_id: string;
  role_name: string;
  description: string;
  created_at: string;
}

export default function RolesPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ role_name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!user?.roles?.includes('SUPER_ADMIN')) { toast.error('Access denied. Super Admin only.'); router.push('/dashboard'); return; }
    loadRoles();
  }, [hasHydrated, isAuthenticated, user, router]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getRoles();
      setRoles(data);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      toast.error(error.response?.data?.detail || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newRole = await rolesApi.createRole({
        role_name: formData.role_name,
        description: formData.description,
      });
      setRoles([...roles, newRole]);
      toast.success('Role created successfully!');
      setShowCreateModal(false);
      setFormData({ role_name: '', description: '' });
    } catch (error: any) {
      console.error('Failed to create role:', error);
      toast.error(error.response?.data?.detail || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      setSubmitting(true);
      const updatedRole = await rolesApi.updateRole(selectedRole.role_id, {
        description: formData.description,
      });
      setRoles(roles.map(r => r.role_id === selectedRole.role_id ? updatedRole : r));
      toast.success('Role updated successfully!');
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.detail || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete "${role.role_name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.deleteRole(role.role_id);
      setRoles(roles.filter(r => r.role_id !== role.role_id));
      toast.success('Role deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const openEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({ role_name: role.role_name, description: role.description });
    setShowEditModal(true);
  };

  if (!hasHydrated || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm"><div className="container mx-auto px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-6 h-6" /></button><div><h1 className="text-2xl font-bold text-gray-900">Role Management</h1><p className="text-sm text-gray-600">Create and manage custom roles</p></div></div><button onClick={() => { setFormData({ role_name: '', description: '' }); setShowCreateModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" />Create Role</button></div></div></div>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Role Management</h3>
              <p className="text-sm text-blue-800">Create custom roles to organize your team members. All roles can be edited or deleted.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {roles.map(role => {
            return (
              <div key={role.role_id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-100">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{role.role_name}</h3>
                      <p className="text-gray-600 text-sm">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => openEdit(role)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(role)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Role</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
                <input
                  type="text"
                  value={formData.role_name}
                  onChange={e => setFormData({...formData, role_name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Project Manager"
                />
                <p className="text-xs text-gray-500 mt-1">Enter any role name you prefer</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit: {selectedRole.role_name}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRole(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRole(null);
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
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
