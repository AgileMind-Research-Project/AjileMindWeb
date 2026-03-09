"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface TemplateSection {
  title: string;
  type: string;
  content: string;
  order: number;
}

interface Template {
  id: number;
  template_name: string;
  report_type: string;
  is_default: boolean;
  sections: TemplateSection[];
}

interface ReportGeneratorProps {
  transcriptId: number;
  onClose: () => void;
  onGenerated: (reportId: number) => void;
}

export default function ReportGenerator({ transcriptId, onClose, onGenerated }: ReportGeneratorProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    templateId: null as number | null,
    useCustomPrompt: false,
    customPrompt: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [error, setError] = useState("");

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE}/api/v1/report-templates`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setTemplates(data);

          // Set default template if available
          const defaultTemplate = data.find((t: Template) => t.is_default);
          if (defaultTemplate) {
            setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (accessToken) {
      fetchTemplates();
    }
  }, [accessToken]);

  // Fetch full template details when selection changes
  useEffect(() => {
    if (!formData.templateId || !accessToken) {
      setSelectedTemplate(null);
      return;
    }
    const fetchTemplateDetail = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/report-templates/${formData.templateId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSelectedTemplate(data);
        }
      } catch (err) {
        console.error("Failed to fetch template detail:", err);
      }
    };
    fetchTemplateDetail();
  }, [formData.templateId, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE}/api/v1/reports/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          transcript_id: transcriptId,
          template_id: formData.templateId,
          use_custom_prompt: formData.useCustomPrompt,
          custom_prompt: formData.useCustomPrompt ? formData.customPrompt : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate report");
      }

      const result = await response.json();
      onGenerated(result.id);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Generate AI Report
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Analyze transcript and create structured insights
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>AI-Powered Report Generation</strong>
                <br />
                Our AI will analyze the transcript and generate a structured report based on the meeting type.
                The report will include key insights, action items, and summaries.
              </p>
            </div>

            {/* Template Selector */}
            {!loadingTemplates && templates.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Report Template
                </label>
                <select
                  value={formData.templateId || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    templateId: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Default (AI Auto-select)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name} {template.is_default && '(Default)'}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Choose a template structure for the generated report
                </p>

                {/* Template Sections Preview */}
                {selectedTemplate && selectedTemplate.sections && selectedTemplate.sections.length > 0 && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Template Sections
                    </p>
                    <div className="space-y-1.5">
                      {[...selectedTemplate.sections]
                        .sort((a, b) => a.order - b.order)
                        .map((section, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{section.title}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({section.type.replace('_', ' ')})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Prompt Toggle */}
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useCustomPrompt}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    useCustomPrompt: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use custom prompt (optional)
                </span>
              </label>
            </div>

            {/* Custom Prompt */}
            {formData.useCustomPrompt && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Prompt
                </label>
                <textarea
                  value={formData.customPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter custom instructions for the AI (e.g., 'Focus on technical details', 'Include specific metrics', etc.)"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Provide specific instructions to guide the AI's report generation
                </p>
              </div>
            )}

            {/* Report Features */}
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {selectedTemplate ? `Report will follow "${selectedTemplate.template_name}" template:` : 'The generated report will include:'}
              </p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>{selectedTemplate ? 'Sections matching template structure' : 'Structured sections based on meeting type'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Key insights and action items</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Editable content with version tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Export to PDF or DOCX format</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Report
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
