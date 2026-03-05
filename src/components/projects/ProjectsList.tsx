'use client';

import React, { useEffect, useState } from 'react';
import BacklogUpload from '@/components/backlog/BacklogUpload';
import PrioritizedBacklogModal from './PrioritizedBacklogModal';
import SubtaskModal from './SubtaskModal';
import AssigneeViewModal from './AssigneeViewModal';
import { API_CONFIG } from '@/lib/config/api.config';
import { useAuth } from '@/lib/hooks/useAuth';

interface Project {
  project_id: number;
  project_name: string;
  key: string;
  project_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  project_lead?: string;
  project_manager?: string[];
  description?: string;
}

interface ProjectsListProps {
  onCreateNew?: () => void;
  onEdit?: (project: Project) => void;
  refreshTrigger?: number;
}

const Avatar = ({ name, className }: { name: string; className?: string }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Generate a consistent pastel color based on name
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-yellow-100 text-yellow-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700'
  ];
  const colorIndex = name.length % colors.length;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-xs border-2 border-white shadow-sm hover:scale-105 transition-transform cursor-help ${colors[colorIndex]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default function ProjectsList({ onCreateNew, onEdit, refreshTrigger }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [showBacklogModal, setShowBacklogModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();

  const getUserRoles = (): string[] => {
    if (!user) return [];
    if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
    if (user.role) {
      if (typeof user.role === 'string' && user.role.startsWith('[')) {
        try { return JSON.parse(user.role); } catch (e) { }
      }
      return [user.role];
    }
    return [];
  };

  const userRoles = getUserRoles();
  const canManage = userRoles.some(r => ['PROJECT_MANAGER', 'PROJECT_LEAD', 'SUPER_ADMIN'].includes(r));

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
      if (!token) {
        setError('Please log in to view projects');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/v1/projects/?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 shadow-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded shadow-sm">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Projects</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Manage your projects, track progress, and coordinate your teams efficiently.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Download Template */}
          <button
            onClick={() => {
              const headers = ['summary', 'description', 'issue_type', 'status', 'priority', 'severity', 'assignee', 'story_points', 'sprint', 'tags'];
              const exampleRow = ['Example Task', 'Task description here', 'Story', 'To Do', 'High', '', 'user@example.com', '5', 'Sprint 1', 'backend,api'];
              const csv = [headers.join(','), exampleRow.join(',')].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'backlog_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="group px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Backlog Template</span>
          </button>

          {/* Create Project Button */}
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-1 text-gray-500 max-w-sm mx-auto">
            Get started by creating your first project to manage tasks, backlogs, and teams.
          </p>
          <div className="mt-6">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              Start a Project
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead & Team</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</th>
                  {canManage && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50/80 transition-colors group">
                    {/* Key ID */}
                    <td className="px-6 py-4 whitespace-nowrap align-top w-24">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-medium bg-gray-100 text-gray-800">
                        {project.key}
                      </span>
                    </td>

                    {/* Project Name & Meta */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col">
                        <div className="text-sm font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {project.project_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize 
                                ${project.project_type === 'software' ? 'bg-blue-50 text-blue-700' :
                              project.project_type === 'business' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {project.project_type.replace('_', ' ')}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-1 max-w-xs" title={project.description}>
                            {project.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Team */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-3">
                        {/* Project Lead */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">Lead:</span>
                          {project.project_lead ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={project.project_lead} className="w-6 h-6 text-[10px]" />
                              <span className="text-sm text-gray-700 truncate max-w-[120px]" title={project.project_lead}>
                                {project.project_lead}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                          )}
                        </div>

                        {/* Managers / Team */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">Team:</span>
                          <div className="flex -space-x-1.5">
                            {(project.project_manager && project.project_manager.length > 0) ? (
                              <>
                                {project.project_manager.slice(0, 4).map((mgr, i) => (
                                  <Avatar key={i} name={mgr} className="w-6 h-6 text-[10px]" />
                                ))}
                                {project.project_manager.length > 4 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-medium text-gray-600">
                                    +{project.project_manager.length - 4}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No managers</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Timeline */}
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="flex flex-col text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-10">Start:</span>
                          <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-10">End:</span>
                          <span className="font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit && onEdit(project)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                            title="Edit Project Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <div className="h-4 w-px bg-gray-200 mx-1"></div>

                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowBacklogModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all"
                            title="Upload Backlog"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowPriorityModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                            title="Prioritize Backlog"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0c0 1.105 1.343 2 3 2s3-.895 3-2-3-2-3 2zM9 10l12-3" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowAssigneeModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-all"
                            title="View Assignees & Priority"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowSubtaskModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all"
                            title="View Subtasks"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              window.location.href = `/dashboard/project-events?project_id=${project.project_id}`;
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            title="Project Events"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {total > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-900">{total}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backlog Upload Modal */}
      {showBacklogModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-sm"
            onClick={() => {
              setShowBacklogModal(false);
              setSelectedProject(null);
            }}
          ></div>

          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div
              className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <BacklogUpload
                projectId={selectedProject.project_id}
                projectName={selectedProject.project_name}
                onSuccess={() => {
                  setShowBacklogModal(false);
                  setSelectedProject(null);
                }}
                onCancel={() => {
                  setShowBacklogModal(false);
                  setSelectedProject(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Prioritized Backlog Modal */}
      {showPriorityModal && selectedProject && (
        <PrioritizedBacklogModal
          projectId={selectedProject.project_id}
          projectName={selectedProject.project_name}
          isOpen={showPriorityModal}
          onClose={() => {
            setShowPriorityModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Assignee View Modal */}
      {showAssigneeModal && selectedProject && (
        <AssigneeViewModal
          projectId={selectedProject.project_id}
          projectName={selectedProject.project_name}
          isOpen={showAssigneeModal}
          onClose={() => {
            setShowAssigneeModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Subtask Modal */}
      {showSubtaskModal && selectedProject && (
        <SubtaskModal
          projectId={selectedProject.project_id}
          projectName={selectedProject.project_name}
          projectKey={selectedProject.key}
          isOpen={showSubtaskModal}
          onClose={() => {
            setShowSubtaskModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
