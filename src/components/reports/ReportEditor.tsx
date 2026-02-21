"use client";

import { useState, useEffect } from "react";
import { Save, X, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface ReportEditorProps {
  reportId: number;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReportEditor({ reportId, onSave, onCancel }: ReportEditorProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  const [report, setReport] = useState<any>(null);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasHydrated && accessToken) {
      fetchReport();
    }
  }, [reportId, hasHydrated, accessToken]);

  const fetchReport = async () => {
    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const data = await response.json();
      setReport(data);
      setEditedContent(JSON.parse(JSON.stringify(data.report_content))); // Deep clone
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editedContent),
      });

      if (!response.ok) {
        throw new Error("Failed to save report");
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setEditedContent((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: string) => {
    setEditedContent((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditedContent((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const renderDailyStandupEditor = () => (
    <div className="space-y-6">
      {/* Yesterday's Work */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Yesterday's Work
          </h3>
          <button
            type="button"
            onClick={() => addArrayItem("yesterday_work")}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {editedContent?.yesterday_work?.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayField("yesterday_work", index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeArrayItem("yesterday_work", index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Plan */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Plan
          </h3>
          <button
            type="button"
            onClick={() => addArrayItem("today_plan")}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {editedContent?.today_plan?.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayField("today_plan", index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeArrayItem("today_plan", index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Blockers */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Blockers & Issues
          </h3>
          <button
            type="button"
            onClick={() => addArrayItem("blockers")}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {editedContent?.blockers?.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayField("blockers", index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeArrayItem("blockers", index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSprintMeetingEditor = () => (
    <div className="space-y-6">
      {["sprint_goals", "progress_summary", "issues_risks"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {editedContent?.[field]?.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRetrospectiveEditor = () => (
    <div className="space-y-6">
      {["what_went_well", "what_didnt_go_well", "improvements", "action_points"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {editedContent?.[field]?.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBrainstormingEditor = () => (
    <div className="space-y-6">
      {/* Meeting Topic */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Meeting Topic
        </label>
        <input
          type="text"
          value={editedContent?.meeting_topic || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, meeting_topic: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Meeting Objective */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Meeting Objective
        </label>
        <textarea
          value={editedContent?.meeting_objective || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, meeting_objective: e.target.value }))}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Summary
        </label>
        <textarea
          value={editedContent?.summary || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, summary: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Array Fields */}
      {["participants", "top_ideas", "categories", "key_themes", "decisions_made"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {editedContent?.[field]?.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !report || !editedContent) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error || "Failed to load report"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Edit {report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version {report.version} • Make changes and save to create version {report.version + 1}
          </p>
        </div>

        {/* Editor Form */}
        <div className="p-8">
          {report.report_type === "daily_standup" && renderDailyStandupEditor()}
          {report.report_type === "sprint_meeting" && renderSprintMeetingEditor()}
          {report.report_type === "retrospective" && renderRetrospectiveEditor()}
          {report.report_type === "brainstorming" && renderBrainstormingEditor()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
