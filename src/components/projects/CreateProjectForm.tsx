'use client';

import React, { useState, useEffect } from 'react';
import { usersApi } from '../../lib/api/users.api';

interface User {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface Project {
    project_id?: number;
    project_name: string;
    key: string;
    project_type: string;
    start_date: string;
    end_date: string;
    description?: string;
    template: string;
    sprint_size?: number;
    project_lead?: string;
    project_manager?: string[];
    architecture_type?: string;
    stack_type?: string;
    frontend_technologies?: string[];
    backend_technologies?: string[];
    cloud_host?: string;
    budget?: number;
}

interface CreateProjectFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    editProject?: Project | null;
    mode?: 'create' | 'edit';
}

// Predefined technology options
const FRONTEND_TECHNOLOGIES = [
    'React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'TypeScript', 'JavaScript',
    'HTML5', 'CSS3', 'TailwindCSS', 'Bootstrap', 'Material-UI', 'Sass', 'Redux',
    'React Native', 'Flutter', 'Webpack', 'Vite'
];

const BACKEND_TECHNOLOGIES = [
    'Node.js', 'Python', 'Java', 'C#', '.NET', 'Go', 'Ruby', 'PHP',
    'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'NestJS',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
    'Docker', 'Kubernetes', 'AWS Lambda', 'Microservices'
];

export default function CreateProjectForm({ onSuccess, onCancel, editProject, mode = 'create' }: CreateProjectFormProps) {
    const [formData, setFormData] = useState({
        project_name: '',
        key: '',
        project_type: 'software',
        start_date: '',
        end_date: '',
        description: '',
        template: 'com.pyxis.greenhopper.jira:gh-scrum-template',
        sprint_size: 2,
        project_lead: '',
        project_manager: [] as string[],
        architecture_type: '',
        stack_type: '',
        frontend_technologies: [] as string[],
        backend_technologies: [] as string[],
        cloud_host: '',
        budget: 0
    });

    const [users, setUsers] = useState<User[]>([]);
    const [projectManagers, setProjectManagers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingManagers, setLoadingManagers] = useState(false);

    // Fetch users for project lead dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const response = await usersApi.listUsers();
                if (response.success) {
                    setUsers(response.data);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []);

    // Fetch PROJECT_MANAGER users for project manager dropdown
    useEffect(() => {
        const fetchProjectManagers = async () => {
            setLoadingManagers(true);
            try {
                const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                const response = await fetch(`${apiUrl}/api/v1/users/by-role/PROJECT_MANAGER`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (data.success) {
                    setProjectManagers(data.data);
                }
            } catch (error) {
                console.error('Error fetching project managers:', error);
            } finally {
                setLoadingManagers(false);
            }
        };

        fetchProjectManagers();
    }, []);

    // Load project data when in edit mode
    useEffect(() => {
        if (editProject && mode === 'edit') {
            setFormData({
                project_name: editProject.project_name || '',
                key: editProject.key || '',
                project_type: editProject.project_type || 'software',
                start_date: editProject.start_date || '',
                end_date: editProject.end_date || '',
                description: editProject.description || '',
                template: editProject.template || 'com.pyxis.greenhopper.jira:gh-scrum-template',
                sprint_size: editProject.sprint_size || 2,
                project_lead: editProject.project_lead || '',
                project_manager: editProject.project_manager || [],
                architecture_type: editProject.architecture_type || '',
                stack_type: editProject.stack_type || '',
                frontend_technologies: editProject.frontend_technologies || [],
                backend_technologies: editProject.backend_technologies || [],
                cloud_host: editProject.cloud_host || '',
                budget: editProject.budget || 0
            });
        }
    }, [editProject, mode]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Convert key to uppercase automatically
        if (name === 'key') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else if (name === 'sprint_size') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleTechSelect = (type: 'frontend' | 'backend', value: string) => {
        const key = type === 'frontend' ? 'frontend_technologies' : 'backend_technologies';

        if (value && !formData[key].includes(value)) {
            setFormData(prev => ({
                ...prev,
                [key]: [...prev[key], value]
            }));
        }
    };

    const removeTechnology = (type: 'frontend' | 'backend', tech: string) => {
        const key = type === 'frontend' ? 'frontend_technologies' : 'backend_technologies';
        setFormData(prev => ({
            ...prev,
            [key]: prev[key].filter(t => t !== tech)
        }));
    };

    const handleManagerSelect = (email: string, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                project_manager: [...prev.project_manager, email]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                project_manager: prev.project_manager.filter(m => m !== email)
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.project_name.trim()) {
            newErrors.project_name = 'Project name is required';
        }

        if (!formData.key.trim()) {
            newErrors.key = 'Project key is required';
        } else if (!/^[A-Z][A-Z0-9]*$/.test(formData.key)) {
            newErrors.key = 'Key must start with a letter and contain only uppercase letters and numbers';
        } else if (formData.key.length < 2 || formData.key.length > 10) {
            newErrors.key = 'Key must be 2-10 characters';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date && formData.end_date <= formData.start_date) {
            newErrors.end_date = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            if (!token) {
                throw new Error('Not authenticated');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            // Fix: use project_id instead of id
            const url = mode === 'edit' && editProject?.project_id
                ? `${apiUrl}/api/v1/projects/${editProject.project_id}`
                : `${apiUrl}/api/v1/projects/`;

            const method = mode === 'edit' ? 'PUT' : 'POST';

            // Prepare payload - only include optional fields if they have values
            const payload: any = {};

            // Required fields for create, optional for update
            if (mode === 'create' || formData.project_name) payload.project_name = formData.project_name;
            if (mode === 'create' || formData.key) payload.key = formData.key;
            if (mode === 'create' || formData.project_type) payload.project_type = formData.project_type;
            if (mode === 'create' || formData.start_date) payload.start_date = formData.start_date;
            if (mode === 'create' || formData.end_date) payload.end_date = formData.end_date;

            // Optional fields - only include if they have values
            if (formData.description) payload.description = formData.description;
            if (mode === 'create') payload.template = formData.template; // Template only for creation

            if (formData.sprint_size) payload.sprint_size = formData.sprint_size;
            if (formData.project_lead) payload.project_lead = formData.project_lead;
            if (formData.project_manager && formData.project_manager.length > 0) payload.project_manager = formData.project_manager;
            if (formData.architecture_type) payload.architecture_type = formData.architecture_type;
            if (formData.stack_type) payload.stack_type = formData.stack_type;
            if (formData.frontend_technologies.length > 0) payload.frontend_technologies = formData.frontend_technologies;
            if (formData.backend_technologies.length > 0) payload.backend_technologies = formData.backend_technologies;
            if (formData.cloud_host) payload.cloud_host = formData.cloud_host;
            if (formData.budget) payload.budget = formData.budget;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${mode} project`);
            }

            // Success!
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error(`Error ${mode}ing project:`, err);
            setSubmitError(err.message || `Failed to ${mode} project`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determine which technology fields to show
    const showFrontendTech = formData.stack_type === 'Frontend' || formData.stack_type === 'Fullstack';
    const showBackendTech = formData.stack_type === 'Backend' || formData.stack_type === 'Fullstack';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r shadow-sm animate-shake">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{submitError}</span>
                    </div>
                </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">📋 Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Name */}
                    <div className="md:col-span-2">
                        <label htmlFor="project_name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="project_name"
                            name="project_name"
                            value={formData.project_name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${errors.project_name
                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                            placeholder="e.g., Website Redesign Project"
                        />
                        {errors.project_name && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.project_name}
                            </p>
                        )}
                    </div>

                    {/* Project Key */}
                    <div>
                        <label htmlFor="key" className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Key <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="key"
                            name="key"
                            value={formData.key}
                            onChange={handleInputChange}
                            maxLength={10}
                            disabled={mode === 'edit'}
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm uppercase font-semibold ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''} ${errors.key
                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                            placeholder="e.g., WEB"
                        />
                        <p className="mt-2 text-xs text-gray-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            2-10 characters, uppercase letters/numbers only
                        </p>
                        {errors.key && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.key}
                            </p>
                        )}
                    </div>

                    {/* Project Type */}
                    <div>
                        <label htmlFor="project_type" className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Type
                        </label>
                        <select
                            id="project_type"
                            name="project_type"
                            value={formData.project_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value="software">🖥️ Software</option>
                            <option value="business">💼 Business</option>
                            <option value="service_desk">🎫 Service Desk</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${errors.start_date
                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                        />
                        {errors.start_date && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.start_date}
                            </p>
                        )}
                    </div>

                    {/* End Date */}
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
                            End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${errors.end_date
                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                        />
                        {errors.end_date && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.end_date}
                            </p>
                        )}
                    </div>

                    {/* Template */}
                    <div className="md:col-span-2">
                        <label htmlFor="template" className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Template
                        </label>
                        <select
                            id="template"
                            name="template"
                            value={formData.template}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value="com.pyxis.greenhopper.jira:gh-scrum-template">🏃 Scrum - Agile sprint-based workflow</option>
                            <option value="com.pyxis.greenhopper.jira:gh-kanban-template">📋 Kanban - Continuous flow workflow</option>
                            <option value="com.atlassian.jira-core-project-templates:jira-core-project-management">📁 Classic - Traditional project management</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200 resize-none"
                            placeholder="Provide a detailed description of your project goals and objectives..."
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            {formData.description.length} characters
                        </p>
                    </div>
                </div>
            </div>

            {/* Project Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">📊 Project Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sprint Size */}
                    <div>
                        <label htmlFor="sprint_size" className="block text-sm font-semibold text-gray-700 mb-2">
                            Sprint Size (weeks)
                        </label>
                        <select
                            id="sprint_size"
                            name="sprint_size"
                            value={formData.sprint_size}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value={2}>2 weeks</option>
                            <option value={4}>4 weeks</option>
                        </select>
                    </div>

                    {/* Project Lead - Dropdown */}
                    <div>
                        <label htmlFor="project_lead" className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Lead
                        </label>
                        <select
                            id="project_lead"
                            name="project_lead"
                            value={formData.project_lead}
                            onChange={handleInputChange}
                            disabled={loadingUsers}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value="">Select project lead...</option>
                            {users.map((user) => (
                                <option key={user.user_id} value={user.email}>
                                    {user.first_name} {user.last_name} ({user.email})
                                </option>
                            ))}
                        </select>
                        {loadingUsers && (
                            <p className="mt-2 text-xs text-gray-500">Loading users...</p>
                        )}
                    </div>

                    {/* Project Managers - Multi-select Checkboxes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Managers
                        </label>
                        <div className="mt-1 border-2 border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                            {loadingManagers ? (
                                <p className="text-sm text-gray-500">Loading project managers...</p>
                            ) : projectManagers.length === 0 ? (
                                <p className="text-sm text-gray-500">No project managers available</p>
                            ) : (
                                <div className="space-y-2">
                                    {projectManagers.map((manager) => (
                                        <label
                                            key={manager.user_id}
                                            className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors duration-150"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.project_manager.includes(manager.email)}
                                                onChange={(e) => handleManagerSelect(manager.email, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-900">
                                                {manager.first_name} {manager.last_name}
                                                <span className="text-gray-500 ml-1">({manager.email})</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {formData.project_manager.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.project_manager.map((email) => {
                                    const manager = projectManagers.find(m => m.email === email);
                                    return (
                                        <span
                                            key={email}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {manager ? `${manager.first_name} ${manager.last_name}` : email}
                                            <button
                                                type="button"
                                                onClick={() => handleManagerSelect(email, false)}
                                                className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            💡 Only users with PROJECT_MANAGER role are shown
                        </p>
                    </div>
                </div>
            </div>

            {/* Architecture & Stack */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">🏗️ Architecture & Stack</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Architecture Type */}
                    <div>
                        <label htmlFor="architecture_type" className="block text-sm font-semibold text-gray-700 mb-2">
                            Architecture Type
                        </label>
                        <select
                            id="architecture_type"
                            name="architecture_type"
                            value={formData.architecture_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value="">Select architecture...</option>
                            <option value="Monolithic">🏢 Monolithic</option>
                            <option value="Microservices">🔗 Microservices</option>
                            <option value="Serverless">☁️ Serverless</option>
                            <option value="Event-Driven">⚡ Event-Driven</option>
                            <option value="Layered">📚 Layered</option>
                            <option value="Modular">🧩 Modular</option>
                            <option value="Other">🔧 Other</option>
                        </select>
                    </div>

                    {/* Stack Type */}
                    <div>
                        <label htmlFor="stack_type" className="block text-sm font-semibold text-gray-700 mb-2">
                            Stack Type
                        </label>
                        <select
                            id="stack_type"
                            name="stack_type"
                            value={formData.stack_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                        >
                            <option value="">Select stack type...</option>
                            <option value="Frontend">🎨 Frontend Only</option>
                            <option value="Backend">⚙️ Backend Only</option>
                            <option value="Fullstack">🔄 Fullstack (Frontend + Backend)</option>
                        </select>
                    </div>

                    {/* Budget */}
                    <div>
                        <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
                            Budget ($)
                        </label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                            placeholder="e.g., 50000.00"
                        />
                    </div>

                    {/* Frontend Technologies - Dropdown */}
                    {showFrontendTech && (
                        <div className="md:col-span-2">
                            <label htmlFor="frontend_tech" className="block text-sm font-semibold text-gray-700 mb-2">
                                Frontend Technologies
                            </label>
                            <select
                                id="frontend_tech"
                                onChange={(e) => handleTechSelect('frontend', e.target.value)}
                                className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                                value=""
                            >
                                <option value="">Select frontend technology...</option>
                                {FRONTEND_TECHNOLOGIES.filter(tech => !formData.frontend_technologies.includes(tech)).map((tech) => (
                                    <option key={tech} value={tech}>{tech}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.frontend_technologies.map((tech) => (
                                    <span key={tech} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => removeTechnology('frontend', tech)}
                                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Backend Technologies - Dropdown */}
                    {showBackendTech && (
                        <div className="md:col-span-2">
                            <label htmlFor="backend_tech" className="block text-sm font-semibold text-gray-700 mb-2">
                                Backend Technologies
                            </label>
                            <select
                                id="backend_tech"
                                onChange={(e) => handleTechSelect('backend', e.target.value)}
                                className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 sm:text-sm transition-all duration-200"
                                value=""
                            >
                                <option value="">Select backend technology...</option>
                                {BACKEND_TECHNOLOGIES.filter(tech => !formData.backend_technologies.includes(tech)).map((tech) => (
                                    <option key={tech} value={tech}>{tech}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.backend_technologies.map((tech) => (
                                    <span key={tech} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => removeTechnology('backend', tech)}
                                            className="ml-2 text-green-600 hover:text-green-800 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cloud Host */}
                    <div className="md:col-span-2">
                        <label htmlFor="cloud_host" className="block text-sm font-semibold text-gray-700 mb-2">
                            Cloud Host Provider
                        </label>
                        <input
                            type="text"
                            id="cloud_host"
                            name="cloud_host"
                            value={formData.cloud_host}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm transition-all duration-200"
                            placeholder="e.g., AWS, Azure, GCP, DigitalOcean"
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 transform hover:scale-105"
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            {mode === 'edit' ? 'Updating Project...' : 'Creating Project...'}
                        </>
                    ) : (
                        <>
                            {mode === 'edit' ? (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Update Project
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Project
                                </>
                            )}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
