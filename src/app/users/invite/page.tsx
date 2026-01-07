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
import { projectsApi } from '@/lib/api/projects.api';
import { User, Mail, Shield, ArrowLeft, Info, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function InviteUserPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const currentUser = useUser();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    project_ids: [] as number[],
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

    // Fetch available roles and projects
    fetchRoles();
    fetchProjects();
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

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.listProjects();
      console.log('Projects response:', response);

      // Handle different response formats
      const projectsData = response.data || response || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      if (projectsData.length === 0) {
        console.log('No projects available.');
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      // Don't show error toast for projects as it's optional
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData({
      ...formData,
      project_ids: selectedOptions,
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
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invite New User</h1>
      </div>

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

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="projects" className="block text-sm font-medium text-gray-700">
                    Assign to Projects (Optional)
                  </label>
                  {formData.project_ids.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formData.project_ids.length} selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-4 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                  <select
                    id="projects"
                    name="projects"
                    multiple
                    size={6}
                    value={formData.project_ids.map(String)}
                    onChange={handleProjectChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
                    style={{
                      minHeight: '150px',
                      backgroundImage: 'none'
                    }}
                  >
                    {projects.length === 0 ? (
                      <option disabled className="text-gray-400">No projects available</option>
                    ) : (
                      projects.map((project) => (
                        <option
                          key={project.project_id}
                          value={project.project_id}
                          className="py-2 px-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {project.key} - {project.project_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    💡 Hold <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> (Windows)
                    or <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Cmd</kbd> (Mac)
                    and click to select multiple projects
                  </p>
                  {formData.project_ids.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-xs font-medium text-blue-800">Selected Projects:</span>
                        {formData.project_ids.map((projectId) => {
                          const project = projects.find(p => p.project_id === projectId);
                          return project ? (
                            <span
                              key={projectId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-full"
                            >
                              {project.key}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    project_ids: formData.project_ids.filter(id => id !== projectId)
                                  });
                                }}
                                className="hover:bg-blue-700 rounded-full p-0.5"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, project_ids: [] })}
                        className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                      >
                        Clear all selections
                      </button>
                    </>
                  )}
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
    </DashboardLayout>
  );
}
