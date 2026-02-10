/**
 * Edit User Page
 * 
 * Edit user details and manage project assignments
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { projectsApi } from '@/lib/api/projects.api';
import { User, Mail, Shield, Briefcase, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params?.userId as string;
    const { isAuthenticated } = useAuth();
    const currentUser = useUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        roles: [] as string[],
        project_ids: [] as number[],
        user_data: {
            stack: [] as string[],
            technologies: [] as string[],
            experience_years: 0,
        },
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!currentUser?.roles?.includes('SUPER_ADMIN') && !currentUser?.roles?.includes('ADMIN')) {
            toast.error('You do not have permission to access this page');
            router.push('/dashboard');
            return;
        }

        fetchData();
    }, [isAuthenticated, currentUser, router, userId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch user details from users list
            const usersResponse = await authApi.listUsers();
            const usersData = usersResponse?.data?.data || usersResponse?.data || [];
            const user = usersData.find((u: any) => u.user_id === userId);

            if (!user) {
                toast.error('User not found');
                router.push('/users');
                return;
            }

            setUserData(user);

            // Fetch roles and projects in parallel
            const [rolesResponse, projectsResponse] = await Promise.all([
                authApi.listAssignableRoles(),
                projectsApi.listProjects()
            ]);

            const rolesData = rolesResponse.data || rolesResponse || [];
            const projectsData = projectsResponse.data || projectsResponse || [];

            setRoles(Array.isArray(rolesData) ? rolesData : []);
            setProjects(Array.isArray(projectsData) ? projectsData : []);

            // Set form data with user's current information
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                roles: user.roles || [],
                project_ids: user.project_ids || [],
                user_data: {
                    stack: user.user_data?.stack || [],
                    technologies: user.user_data?.technologies || [],
                    experience_years: user.user_data?.experience_years || 0,
                },
            });
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load user data');
            router.push('/users');
        } finally {
            setLoading(false);
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
        setSaving(true);

        try {
            // Check if user_data has changed
            const userDataChanged = JSON.stringify(formData.user_data) !== JSON.stringify(userData.user_data || { stack: [], technologies: [], experience_years: 0 });

            // Update user basic details (name, roles, user_data)
            if (formData.first_name !== userData.first_name ||
                formData.last_name !== userData.last_name ||
                JSON.stringify(formData.roles) !== JSON.stringify(userData.roles) ||
                userDataChanged) {
                await authApi.updateUser(userId, {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    roles: formData.roles,
                    user_data: formData.user_data,
                });
            }

            // Update user projects
            if (JSON.stringify(formData.project_ids) !== JSON.stringify(userData.project_ids || [])) {
                await authApi.updateUserProjects(userId, formData.project_ids);
            }

            toast.success('User updated successfully!');
            router.push('/users');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to update user';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* User Info Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-2xl">
                                    {userData.first_name?.[0] || userData.email[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {userData.first_name || userData.last_name
                                        ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                                        : 'No name'}
                                </h2>
                                <p className="text-gray-600">{userData.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {userData.role}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${userData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {userData.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white rounded-xl shadow-md p-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit User Details</h3>
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

                            {/* Email (Read-only) */}
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
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                            </div>

                            {/* Roles - Multi-Select */}
                            <div>
                                <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-2">
                                    Roles *
                                    {userData?.roles?.includes('SUPER_ADMIN') && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            Protected
                                        </span>
                                    )}
                                </label>
                                {/* Check if user has SUPER_ADMIN role - if so, disable editing */}
                                {userData?.roles?.includes('SUPER_ADMIN') ? (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <p className="text-sm text-purple-800">
                                            <strong>Super Admin users</strong> cannot have their roles modified for security reasons.
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {userData.roles.map((roleName: string) => (
                                                <span
                                                    key={roleName}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-full"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    {roleName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-4 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                            <select
                                                id="roles"
                                                name="roles"
                                                multiple
                                                size={Math.min(roles.length, 5)}
                                                value={formData.roles}
                                                onChange={(e) => {
                                                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                    setFormData({ ...formData, roles: selectedOptions });
                                                }}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
                                                style={{ minHeight: '120px', backgroundImage: 'none' }}
                                            >
                                                {roles.map((role) => (
                                                    <option key={role.role_name} value={role.role_name} className="py-2 px-2 hover:bg-blue-50 cursor-pointer">
                                                        {role.role_name} - {role.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-gray-500">
                                                💡 Hold <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> (Windows)
                                                or <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Cmd</kbd> (Mac)
                                                and click to select multiple roles
                                            </p>
                                            {formData.roles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                    <span className="text-xs font-medium text-purple-800">Selected Roles:</span>
                                                    {formData.roles.map((roleName) => {
                                                        const role = roles.find(r => r.role_name === roleName);
                                                        return role ? (
                                                            <span
                                                                key={roleName}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-xs font-medium rounded-full"
                                                            >
                                                                {role.role_name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            roles: formData.roles.filter(r => r !== roleName)
                                                                        });
                                                                    }}
                                                                    className="hover:bg-purple-700 rounded-full p-0.5"
                                                                >
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* User Profile Data Section */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile Information</h3>

                                {/* Stack */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Technology Stack
                                    </label>
                                    <div className="space-y-2">
                                        {['backend', 'frontend'].map((stackOption) => (
                                            <label key={stackOption} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.user_data.stack.includes(stackOption)}
                                                    onChange={(e) => {
                                                        const newStack = e.target.checked
                                                            ? [...formData.user_data.stack, stackOption]
                                                            : formData.user_data.stack.filter(s => s !== stackOption);
                                                        setFormData({
                                                            ...formData,
                                                            user_data: { ...formData.user_data, stack: newStack }
                                                        });
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 capitalize">{stackOption}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Technologies */}
                                <div className="mb-6">
                                    <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-2">
                                        Technologies/Frameworks
                                    </label>
                                    <input
                                        type="text"
                                        id="technologies"
                                        value={formData.user_data.technologies.join(', ')}
                                        placeholder="e.g., java, spring, mysql, react (comma-separated)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => {
                                            const techs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                            setFormData({
                                                ...formData,
                                                user_data: { ...formData.user_data, technologies: techs }
                                            });
                                        }}
                                    />
                                    {formData.user_data.technologies.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {formData.user_data.technologies.map((tech, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                                                >
                                                    {tech}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTechs = formData.user_data.technologies.filter((_, i) => i !== idx);
                                                            setFormData({
                                                                ...formData,
                                                                user_data: { ...formData.user_data, technologies: newTechs }
                                                            });
                                                        }}
                                                        className="hover:bg-green-200 rounded-full p-0.5"
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Experience Years */}
                                <div>
                                    <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-2">
                                        Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        id="experience_years"
                                        min="0"
                                        max="50"
                                        value={formData.user_data.experience_years}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                user_data: { ...formData.user_data, experience_years: parseInt(e.target.value) || 0 }
                                            });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Projects */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="projects" className="block text-sm font-medium text-gray-700">
                                        Assign to Projects
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
                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => router.push('/users')}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> You can edit the user's name, role, and project assignments. Email addresses cannot be changed for security reasons.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
