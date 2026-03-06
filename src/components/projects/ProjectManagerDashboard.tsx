'use client';

import React, { useState } from 'react';
import ProjectsList from '@/components/projects/ProjectsList';
import CreateProjectForm from '@/components/projects/CreateProjectForm';

interface Project {
  id: number;
  project_name: string;
  key: string;
  project_type: string;
  start_date: string;
  end_date: string;
  description?: string;
  template: string;
  trust_index_threshold?: number;
  prioritize_task_count?: number;
  working_hours_for_day?: number;
}

export default function ProjectManagerDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Trigger refresh of project list
    setRefreshTrigger(prev => prev + 1);
    // Show success message
    setShowSuccessMessage(true);
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditProject(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setModalMode('edit');
    setEditProject(project);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditProject(null);
  };

  return (
    <>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start animate-fade-in">
          <svg
            className="w-6 h-6 text-green-600 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-green-900">Project Created Successfully!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your project has been created in Jira and saved to the database.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      <ProjectsList
        onCreateNew={handleOpenCreateModal}
        onEdit={handleOpenEditModal as any}
        refreshTrigger={refreshTrigger}
      />

      {/* Create/Edit Project Modal Popup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with animation */}
          <div
            className="fixed inset-0 bg-black transition-opacity duration-300 ease-out"
            style={{ opacity: showCreateModal ? 0.6 : 0 }}
            onClick={handleCloseModal}
          ></div>

          {/* Modal Container */}
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            {/* Modal Content with professional styling */}
            <div
              className="relative bg-white rounded-xl shadow-2xl transform transition-all duration-300 ease-out w-full max-w-5xl"
              style={{
                animation: 'slideInUp 0.3s ease-out',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      {modalMode === 'edit' ? (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {modalMode === 'edit' ? 'Edit Project' : 'Create New Project'}
                      </h2>
                      <p className="mt-1 text-sm text-blue-100">
                        {modalMode === 'edit'
                          ? 'Update your project details and save changes'
                          : 'Set up a new project in your workspace'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body with scrollable content */}
              <div
                className="px-8 py-6 overflow-y-auto bg-gray-50"
                style={{ flex: '1 1 auto', maxHeight: 'calc(90vh - 180px)' }}
              >
                <CreateProjectForm
                  onSuccess={handleCreateSuccess}
                  onCancel={handleCloseModal}
                  editProject={editProject}
                  mode={modalMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
