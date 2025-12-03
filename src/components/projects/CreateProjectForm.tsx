'use client';

import React, { useState, useEffect } from 'react';

interface Project {
  id?: number;
  project_name: string;
  key: string;
  project_type: string;
  start_date: string;
  end_date: string;
  description?: string;
  template: string;
}

interface CreateProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editProject?: Project | null;
  mode?: 'create' | 'edit';
}

export default function CreateProjectForm({ onSuccess, onCancel, editProject, mode = 'create' }: CreateProjectFormProps) {
  const [formData, setFormData] = useState({
    project_name: '',
    key: '',
    project_type: 'software',
    start_date: '',
    end_date: '',
    description: '',
    template: 'com.pyxis.greenhopper.jira:gh-scrum-template'
  });

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
        template: editProject.template || 'com.pyxis.greenhopper.jira:gh-scrum-template'
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      const url = mode === 'edit' && editProject?.id 
        ? `${apiUrl}/api/v1/projects/${editProject.id}` 
        : `${apiUrl}/api/v1/projects/`;
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
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
            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${
              errors.project_name
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
            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm uppercase font-semibold ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''} ${
              errors.key
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
            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${
              errors.start_date
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
            className={`mt-1 block w-full px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200 sm:text-sm ${
              errors.end_date
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
