"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, X, Plus, Trash2, Loader2, GripVertical, ChevronLeft, Star,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

const API_BASE = "http://localhost:8000";

// Available sections per report type
const SECTIONS_BY_TYPE: Record<string, { key: string; title: string; type: string }[]> = {
  daily_standup: [
    { key: "yesterday_work", title: "Yesterday's Work", type: "bullet_list" },
    { key: "today_plan", title: "Today's Plan", type: "bullet_list" },
    { key: "blockers", title: "Blockers & Issues", type: "bullet_list" },
  ],
  sprint_meeting: [
    { key: "sprint_goals", title: "Sprint Goals", type: "bullet_list" },
    { key: "progress_summary", title: "Progress Summary", type: "paragraph" },
    { key: "issues_risks", title: "Issues & Risks", type: "bullet_list" },
    { key: "action_items", title: "Action Items", type: "table" },
  ],
  retrospective: [
    { key: "what_went_well", title: "What Went Well", type: "bullet_list" },
    { key: "what_didnt_go_well", title: "What Didn't Go Well", type: "bullet_list" },
    { key: "improvements", title: "Improvements", type: "bullet_list" },
    { key: "action_points", title: "Action Points", type: "table" },
  ],
  brainstorming: [
    { key: "meeting_topic", title: "Meeting Topic", type: "heading" },
    { key: "meeting_objective", title: "Meeting Objective", type: "paragraph" },
    { key: "participants", title: "Participants", type: "bullet_list" },
    { key: "summary", title: "Summary", type: "paragraph" },
    { key: "top_ideas", title: "Top Ideas", type: "bullet_list" },
    { key: "ideas_generated", title: "Ideas Generated", type: "table" },
    { key: "categories", title: "Categories", type: "bullet_list" },
    { key: "key_themes", title: "Key Themes", type: "bullet_list" },
    { key: "decisions_made", title: "Decisions Made", type: "table" },
    { key: "next_steps", title: "Next Steps", type: "table" },
  ],
};

const SECTION_TYPES = [
  { value: "paragraph", label: "Paragraph" },
  { value: "bullet_list", label: "Bullet List" },
  { value: "numbered_list", label: "Numbered List" },
  { value: "table", label: "Table" },
  { value: "heading", label: "Heading" },
];

interface TemplateSection {
  title: string;
  type: string;
  content: string;
  order: number;
}

interface TemplateEditorProps {
  templateId?: number; // null for new
}

export default function TemplateEditor({ templateId }: TemplateEditorProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const isNew = !templateId;

  const [templateName, setTemplateName] = useState("");
  const [reportType, setReportType] = useState("daily_standup");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable title state
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !accessToken) {
      router.push("/login");
      return;
    }
    if (!isNew) fetchTemplate();
  }, [hasHydrated, isAuthenticated, accessToken, templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/report-templates/${templateId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      setTemplateName(data.template_name);
      setReportType(data.report_type);
      setSections(
        (data.sections || []).map((s: any, i: number) => ({
          title: s.title || "",
          type: s.type || "paragraph",
          content: s.content || "",
          order: s.order ?? i,
        }))
      );
      setIsDefault(data.is_default);
    } catch (err: any) {
      setError(err.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }
    if (sections.length === 0) {
      setError("Add at least one section");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        template_name: templateName.trim(),
        report_type: reportType,
        sections: sections.map((s, i) => ({
          title: s.title,
          type: s.type,
          content: s.content || null,
          order: i,
        })),
        is_default: isDefault,
      };

      const url = isNew
        ? `${API_BASE}/api/v1/report-templates`
        : `${API_BASE}/api/v1/report-templates/${templateId}`;

      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to save template");
      }

      router.push("/reports/templates");
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Get available sections for dropdown (exclude already added)
  const getAvailableSections = () => {
    const available = SECTIONS_BY_TYPE[reportType] || [];
    const addedKeys = sections.map((s) => s.title);
    return available.filter((a) => !addedKeys.includes(a.title));
  };

  const addSectionFromDropdown = (key: string) => {
    const available = SECTIONS_BY_TYPE[reportType] || [];
    const sectionDef = available.find((a) => a.key === key);
    if (!sectionDef) return;

    setSections((prev) => [
      ...prev,
      {
        title: sectionDef.title,
        type: sectionDef.type,
        content: "",
        order: prev.length,
      },
    ]);
  };

  const addCustomSection = () => {
    setSections((prev) => [
      ...prev,
      { title: "New Section", type: "paragraph", content: "", order: prev.length },
    ]);
  };

  const updateSection = (index: number, field: keyof TemplateSection, value: string | number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  // When report type changes, clear sections and offer to populate defaults
  const handleReportTypeChange = (newType: string) => {
    setReportType(newType);
    // Auto-populate default sections for the new type
    const defaults = SECTIONS_BY_TYPE[newType] || [];
    setSections(
      defaults.map((d, i) => ({
        title: d.title,
        type: d.type,
        content: "",
        order: i,
      }))
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/reports/templates")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isNew ? "Create New Template" : "Edit Template"}
            </h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Name - editable inline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name
            </label>
            {editingTitle || isNew ? (
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                placeholder="Enter template name..."
                autoFocus={editingTitle}
                className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <div
                onClick={() => setEditingTitle(true)}
                className="w-full px-4 py-3 text-xl font-semibold text-gray-900 dark:text-white border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded-lg cursor-pointer transition-colors"
              >
                {templateName || "Click to set template name"}
              </div>
            )}
          </div>

          {/* Report Type & Default */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily_standup">Daily Standup</option>
                <option value="sprint_meeting">Sprint Meeting</option>
                <option value="retrospective">Retrospective</option>
                <option value="brainstorming">Brainstorming</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Set as Default Template
                </span>
              </label>
            </div>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sections ({sections.length})
              </h2>
              <div className="flex gap-2">
                {/* Dropdown to add predefined section */}
                {getAvailableSections().length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSectionFromDropdown(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      + Add Section...
                    </option>
                    {getAvailableSections().map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={addCustomSection}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Custom Section
                </button>
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  No sections added yet. Use the dropdown above to add sections for this report type.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-start gap-3">
                      {/* Reorder controls */}
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          onClick={() => moveSection(index, "up")}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={() => moveSection(index, "down")}
                          disabled={index === sections.length - 1}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Section fields */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Section Title
                            </label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(index, "title", e.target.value)}
                              placeholder="Section title"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Section Type
                            </label>
                            <select
                              value={section.type}
                              onChange={(e) => updateSection(index, "type", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {SECTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Default Content (optional)
                          </label>
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(index, "content", e.target.value)}
                            placeholder="Default content or instructions for this section..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1"
                        title="Remove section"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isNew ? "Create Template" : "Save Changes"}
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/reports/templates")}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
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
