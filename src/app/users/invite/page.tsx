/**
 * Invite User Page
 * 
 * Super Admin/Admin can invite users with role assignment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { User, Mail, Shield, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteUserPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const currentUser = useUser();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
      return;
    }

    // Fetch available roles
    fetchRoles();
  }, [isAuthenticated, currentUser, router]);

  const fetchRoles = async () => {
    try {
      const response = await authApi.listRoles();
      console.log('Roles response:', response);
      
      // Handle different response formats
      const rolesData = response.data || response || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      
      if (rolesData.length === 0) {
        toast.info('No roles available. Please create roles first.');
      }
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to fetch roles. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.inviteUser(formData);
      toast.success('User invited successfully! Credentials sent to their email.');
      router.push('/users');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to invite user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Invite New User</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Auto-Generated Password</p>
                <p>
                  A temporary password will be automatically generated using the format:{' '}
                  <code className="bg-blue-100 px-1 rounded">{'{FirstName}{EmailLocal}@123'}</code>
                </p>
                <p className="mt-1">
                  Example: For John Doe (john.doe@company.com), password will be:{' '}
                  <code className="bg-blue-100 px-1 rounded">Johnjohn.doe@123</code>
                </p>
                <p className="mt-2 text-blue-700">
                  The user will receive a welcome email with their login credentials and must change their password on first login.
                </p>
              </div>
            </div>
          </div>

          {/* Invite Form */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@company.com"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.role_name} value={role.role_name}>
                        {role.role_name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
