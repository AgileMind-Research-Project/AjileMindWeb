"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Filter, FileText, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface Transcript {
  id: number;
  title: string;
  category: string;
  transcript_date: string;
  tags: string[] | null;
  file_name: string | null;
  created_at: string;
  project_id?: number;
  project_name?: string;
}

interface Project {
  project_id: number;
  project_name: string;
  key: string;
}

interface TranscriptListResponse {
  transcripts: Transcript[];
  total: number;
  page: number;
  page_size: number;
}

export default function TranscriptList() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [data, setData] = useState<TranscriptListResponse>({
    transcripts: [],
    total: 0,
    page: 1,
    page_size: 20
  });

  const [filters, setFilters] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
    search: "",
    page: 1,
    projectId: ""
  });

  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasHydrated) {
      return; // Wait for hydration
    }
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProjects();
    fetchTranscripts();
  }, [filters, isAuthenticated, hasHydrated]);

  const fetchProjects = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setProjects(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchTranscripts = async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.projectId) params.append("project_id", filters.projectId);
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);
      if (filters.search) params.append("search", filters.search);
      params.append("page", filters.page.toString());
      params.append("page_size", "20");

      const response = await fetch(`${API_BASE}/api/v1/transcripts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transcripts");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transcript? This will also delete all associated reports.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/transcripts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete transcript");
      }

      // Refresh list
      fetchTranscripts();
    } catch (err: any) {
      alert(err.message || "Failed to delete transcript");
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      daily_standup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      sprint_planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      sprint_meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };

    const labels = {
      daily_standup: "Daily Standup",
      sprint_planning: "Sprint Planning",
      sprint_meeting: "Sprint Meeting",
      retrospective: "Retrospective"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[category as keyof typeof styles]}`}>
        {labels[category as keyof typeof labels]}
      </span>
    );
  };

  const totalPages = Math.ceil(data.total / data.page_size);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Transcripts
            </h1>
            <button
              onClick={() => router.push("/transcripts/upload")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Upload New
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transcripts..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="daily_standup">Daily Standup</option>
                <option value="sprint_planning">Sprint Planning</option>
                <option value="sprint_meeting">Sprint Meeting</option>
                <option value="retrospective">Retrospective</option>
              </select>
            </div>

            {/* Project Filter */}
            <div>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name} ({project.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="From"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading transcripts...</p>
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

        {/* Transcripts List */}
        {!loading && !error && (
          <>
            {data.transcripts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No transcripts found</p>
                <button
                  onClick={() => router.push("/transcripts/upload")}
                  className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Upload your first transcript
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.transcripts.map((transcript) => (
                        <tr
                          key={transcript.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {transcript.title}
                                </p>
                                {transcript.file_name && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {transcript.file_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getCategoryBadge(transcript.category)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            {new Date(transcript.transcript_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {transcript.tags && transcript.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {transcript.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/transcripts/${transcript.id}`)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                title="View"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(transcript.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
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
                    Showing {((data.page - 1) * data.page_size) + 1} to {Math.min(data.page * data.page_size, data.total)} of {data.total} transcripts
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
    </div>
  );
}
