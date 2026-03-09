"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bug, Check, X, ChevronLeft, ChevronRight, AlertTriangle,
  Calendar, Eye, Flame, TrendingUp
} from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';
import DashboardLayout from "@/components/layout/DashboardLayout";

const API_BASE = 'http://localhost:8000';

interface RecurringBug {
  bug_hash: string;
  bug_title: string;
  mention_count: number;
  is_recurring: boolean;
  first_reported: string;
  last_reported: string;
  project_id: number;
  sources: string[];  // Array of source section names
  status: 'open' | 'resolved' | 'dismissed';
}

interface RecurringBugListResponse {
  bugs: RecurringBug[];
  total: number;
  page: number;
  page_size: number;
}

export default function RecurringBugsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [data, setData] = useState<RecurringBugListResponse>({
    bugs: [],
    total: 0,
    page: 1,
    page_size: 20
  });

  const [filters, setFilters] = useState({
    status: "",
    show_all: false,
    page: 1
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingBug, setViewingBug] = useState<RecurringBug | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBugs();
  }, [filters, isAuthenticated, hasHydrated]);

  const fetchBugs = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.show_all) params.append("show_all", "true");
      params.append("page", filters.page.toString());
      params.append("page_size", "20");

      const response = await fetch(`${API_BASE}/api/v1/recurring-bugs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bugs");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (bugHash: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/recurring-bugs/${bugHash}/dismiss`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss bug");
      }

      fetchBugs();
    } catch (err: any) {
      alert(err.message || "Failed to dismiss bug");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(data.total / data.page_size);

  const handleResolve = async (bugHash: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/recurring-bugs/${bugHash}/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to resolve bug");
      }

      fetchBugs();
    } catch (err: any) {
      alert(err.message || "Failed to resolve bug");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Bug className="w-8 h-8 text-red-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Recurring Bugs
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
              Issues mentioned multiple times across meetings are shown as recurring. 
              Create backlog items for persistent bugs that need attention.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.show_all}
                    onChange={(e) => setFilters(prev => ({ ...prev, show_all: e.target.checked, page: 1 }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Show all issues (including single mentions)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading bugs...</p>
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

          {/* Bugs List */}
          {!loading && !error && (
            <>
              {data.bugs.length === 0 ? (
                <div className="p-12 text-center">
                  <Bug className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No recurring bugs found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Bugs will appear here when reports are generated from meetings
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Issue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Mentions
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Last Mentioned
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
                        {data.bugs.map((bug) => (
                          <tr
                            key={bug.bug_hash}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-2">
                                {bug.is_recurring ? (
                                  <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                    {bug.bug_title}
                                  </p>
                                  {bug.is_recurring && (
                                    <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-0.5 rounded mt-1 inline-block">
                                      Recurring
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-medium ${bug.mention_count >= 3 ? 'text-orange-600' : bug.mention_count >= 2 ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                {bug.mention_count}x
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(bug.last_reported)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(bug.status)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setViewingBug(bug)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  title="View Details"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                    {bug.status === 'open' && (
                                  <>
                                    <button
                                      onClick={() => handleResolve(bug.bug_hash)}
                                      className="text-green-600 hover:text-green-700 dark:text-green-400"
                                      title="Mark Resolved"
                                    >
                                      <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDismiss(bug.bug_hash)}
                                      className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                                      title="Dismiss"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </>
                                )}
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
                      Showing {((data.page - 1) * data.page_size) + 1} to {Math.min(data.page * data.page_size, data.total)} of {data.total} bugs
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
                        Page {data.page} of {totalPages || 1}
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

        {/* View Details Modal */}
        {viewingBug && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bug className="w-6 h-6 text-red-500" />
                Bug Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="text-gray-900 dark:text-white mt-1">{viewingBug.bug_title}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <div className="mt-1">{getStatusBadge(viewingBug.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mentions</h3>
                    <p className="text-gray-900 dark:text-white mt-1 font-medium">{viewingBug.mention_count}x</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">First Mentioned</h3>
                    <p className="text-gray-900 dark:text-white mt-1">{formatDate(viewingBug.first_reported)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Mentioned</h3>
                    <p className="text-gray-900 dark:text-white mt-1">{formatDate(viewingBug.last_reported)}</p>
                  </div>
                </div>

                {viewingBug.is_recurring && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 px-4 py-3 rounded-lg">
                    <p className="text-orange-800 dark:text-orange-200 text-sm">
                      <Flame className="w-4 h-4 inline mr-1" />
                      This issue has been mentioned {viewingBug.mention_count} times across different meetings
                    </p>
                  </div>
                )}

                {viewingBug.sources && viewingBug.sources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Found In
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingBug.sources.map((source, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                          {source.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                {viewingBug.status === 'open' && (
                  <>
                    <button
                      onClick={() => {
                        handleResolve(viewingBug.bug_hash);
                        setViewingBug(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingBug(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
