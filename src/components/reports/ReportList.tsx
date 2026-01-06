"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, FileBarChart, Eye, Trash2, 
  ChevronLeft, ChevronRight, Calendar 
} from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface Report {
  id: number;
  transcript_id: number;
  report_type: string;
  template_id: number | null;
  version: number;
  status: string;
  generated_at: string;
  updated_at: string;
}

interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  page_size: number;
}

export default function ReportList() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  const [data, setData] = useState<ReportListResponse>({
    reports: [],
    total: 0,
    page: 1,
    page_size: 20
  });
  
  const [filters, setFilters] = useState({
    reportType: "",
    status: "",
    page: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasHydrated) {
      console.log('Waiting for auth store to hydrate...');
      return; // Wait for hydration
    }
    console.log('Auth hydrated. isAuthenticated:', isAuthenticated, 'accessToken exists:', !!accessToken);
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }
    fetchReports();
  }, [filters, isAuthenticated, hasHydrated, accessToken]);

  const fetchReports = async () => {
    if (!accessToken) {
      console.log('No access token available');
      return;
    }
    
    console.log('Fetching reports with token:', accessToken?.substring(0, 20) + '...');
    
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.reportType) params.append("report_type", filters.reportType);
      if (filters.status) params.append("status", filters.status);
      params.append("page", filters.page.toString());
      params.append("page_size", "20");

      const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`,
      };
      
      console.log('Request headers:', headers);
      
      const response = await fetch(`http://localhost:8000/api/v1/reports/?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`http://localhost:8000/api/v1/reports/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to delete report");
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      daily_standup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      sprint_meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === "published" ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
        Published
      </span>
    ) : (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-xs">
        Draft
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
              AI Reports
            </h1>
            <button
              onClick={() => router.push("/transcripts")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              View Transcripts
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <select
                value={filters.reportType}
                onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Report Types</option>
                <option value="daily_standup">Daily Standup</option>
                <option value="sprint_meeting">Sprint Meeting</option>
                <option value="retrospective">Retrospective</option>
              </select>
            </div>

            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading reports...</p>
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

        {/* Reports List */}
        {!loading && !error && (
          <>
            {data.reports.length === 0 ? (
              <div className="p-12 text-center">
                <FileBarChart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No reports found</p>
                <button
                  onClick={() => router.push("/transcripts")}
                  className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Upload a transcript to generate reports
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Report Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Version
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.reports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <FileBarChart className="w-5 h-5 text-blue-600" />
                              {getTypeBadge(report.report_type)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            v{report.version}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            {new Date(report.generated_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/reports/${report.id}`)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                title="View"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(report.id)}
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
                    Showing {((data.page - 1) * data.page_size) + 1} to {Math.min(data.page * data.page_size, data.total)} of {data.total} reports
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
