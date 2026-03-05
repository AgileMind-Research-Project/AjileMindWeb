"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Filter, ListChecks, Eye, Check, X, Edit2,
  ChevronLeft, ChevronRight, Calendar, User, AlertCircle
} from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';
import DashboardLayout from "@/components/layout/DashboardLayout";

const API_BASE = 'http://localhost:8000';

interface NewTask {
  id: number;
  report_id: number;
  transcript_id: number;
  project_id: number | null;
  task_title: string;
  assignee: string | null;
  due_date: string | null;
  priority: string | null;
  status: 'pending' | 'approved' | 'removed';
  created_at: string;
  updated_at: string;
}

interface NewTaskListResponse {
  tasks: NewTask[];
  total: number;
  page: number;
  page_size: number;
}

export default function NewTasksPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [data, setData] = useState<NewTaskListResponse>({
    tasks: [],
    total: 0,
    page: 1,
    page_size: 20
  });

  const [filters, setFilters] = useState({
    status: "",
    page: 1
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<NewTask | null>(null);
  const [editForm, setEditForm] = useState({
    task_title: "",
    assignee: "",
    due_date: "",
    priority: ""
  });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchTasks();
  }, [filters, isAuthenticated, hasHydrated]);

  const fetchTasks = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      params.append("page", filters.page.toString());
      params.append("page_size", "20");

      const response = await fetch(`${API_BASE}/api/v1/new-tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task: NewTask) => {
    // Check if task has project_id
    if (!task.project_id) {
      alert("Cannot approve task: No project associated. Please ensure the transcript was linked to a project.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/new-tasks/${task.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to approve task");
      }

      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to approve task");
    }
  };

  const handleRemove = async (taskId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/new-tasks/${taskId}/remove`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove task");
      }

      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to remove task");
    }
  };

  const handleEdit = (task: NewTask) => {
    setEditingTask(task);
    setEditForm({
      task_title: task.task_title,
      assignee: task.assignee || "",
      due_date: task.due_date || "",
      priority: task.priority || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/new-tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_title: editForm.task_title,
          assignee: editForm.assignee || null,
          due_date: editForm.due_date || null,
          priority: editForm.priority || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to update task");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      removed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const styles = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority.toLowerCase() as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const totalPages = Math.ceil(data.total / data.page_size);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <ListChecks className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  New Tasks
                </h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Back to Dashboard
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tasks extracted from brainstorming reports. Approve to add to backlog or remove to reject.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading tasks...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            </div>
          )}

          {/* Tasks List */}
          {!loading && !error && (
            <>
              {data.tasks.length === 0 ? (
                <div className="p-12 text-center">
                  <ListChecks className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Tasks will appear here when brainstorming reports are generated
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.tasks.map((task) => (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {task.task_title}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {task.assignee ? (
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {task.assignee}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {task.due_date ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {task.due_date}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {getPriorityBadge(task.priority)}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(task.status)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {task.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(task)}
                                      disabled={!task.project_id}
                                      className={`${task.project_id ? 'text-green-600 hover:text-green-700 dark:text-green-400' : 'text-gray-400 cursor-not-allowed'}`}
                                      title={task.project_id ? "Approve & Add to Backlog" : "No project associated"}
                                    >
                                      <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleRemove(task.id)}
                                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                                      title="Remove"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  title="Edit"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {((data.page - 1) * data.page_size) + 1} to {Math.min(data.page * data.page_size, data.total)} of {data.total} tasks
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={data.page === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Page {data.page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={data.page >= totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={editForm.task_title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, task_title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={editForm.assignee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, assignee: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                    placeholder="e.g., Feb 22"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
