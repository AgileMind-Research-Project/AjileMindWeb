"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Edit, Trash2, FileBarChart, Search, Filter, Star
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

const API_BASE = "http://localhost:8000";

interface Template {
  id: number;
  template_name: string;
  report_type: string;
  sections: any[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function TemplateList() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !accessToken) {
      router.push("/login");
      return;
    }
    fetchTemplates();
  }, [hasHydrated, isAuthenticated, accessToken, filterType]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("report_type", filterType);

      const response = await fetch(
        `${API_BASE}/api/v1/report-templates?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/report-templates/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete template");
      setDeleteConfirm(null);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to delete template");
    }
  };

  const reportTypeLabel = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const reportTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily_standup: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      sprint_meeting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      brainstorming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Report Templates
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage templates for report generation
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/reports/templates/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Report Types</option>
          <option value="daily_standup">Daily Standup</option>
          <option value="sprint_meeting">Sprint Meeting</option>
          <option value="retrospective">Retrospective</option>
          <option value="brainstorming">Brainstorming</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <FileBarChart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Templates Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first report template to get started.
          </p>
          <button
            onClick={() => router.push("/reports/templates/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        /* Template Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                    {template.template_name}
                  </h3>
                  {template.is_default && (
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 fill-yellow-500" />
                  )}
                </div>

                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${reportTypeBadgeColor(
                    template.report_type
                  )}`}
                >
                  {reportTypeLabel(template.report_type)}
                </span>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p>{template.sections?.length || 0} sections</p>
                  <p className="mt-1">
                    Updated{" "}
                    {new Date(template.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Section preview */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.sections?.slice(0, 4).map((section: any, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                    >
                      {section.title}
                    </span>
                  ))}
                  {(template.sections?.length || 0) > 4 && (
                    <span className="text-xs text-gray-400">
                      +{template.sections.length - 4} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() =>
                      router.push(`/reports/templates/${template.id}`)
                    }
                    className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  {deleteConfirm === template.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
