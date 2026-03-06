"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileBarChart, Edit, Download, Calendar, ChevronLeft, 
  FileText, CheckCircle, Clock 
} from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface Report {
  id: number;
  transcript_id: number;
  report_type: string;
  report_content: any;
  template_id: number | null;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ReportViewerProps {
  reportId: number;
  onEdit: () => void;
}

export default function ReportViewer({ reportId, onEdit }: ReportViewerProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (hasHydrated && accessToken) {
      fetchReport();
    }
  }, [reportId, hasHydrated, accessToken, isAuthenticated]);

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
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    setExporting(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${API_BASE}/api/v1/reports/${reportId}/export`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          format: format,
          include_header: true,
          include_footer: true,
          template_id: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const renderDailyStandup = (content: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Yesterday's Work
        </h3>
        <ul className="space-y-2 ml-7">
          {content.yesterday_work?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Today's Plan
        </h3>
        <ul className="space-y-2 ml-7">
          {content.today_plan?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          Blockers & Issues
        </h3>
        {content.blockers && content.blockers.length > 0 ? (
          <ul className="space-y-2 ml-7">
            {content.blockers.map((item: string, index: number) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 ml-7">No blockers reported.</p>
        )}
      </div>
    </div>
  );

  const renderSprintMeeting = (content: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sprint Goals</h3>
        <ul className="space-y-2 ml-7">
          {content.sprint_goals?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Progress Summary</h3>
        {Array.isArray(content.progress_summary) ? (
          <ul className="space-y-2 ml-7">
            {content.progress_summary.map((item: string, index: number) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {content.progress_summary || "No progress summary available."}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Issues & Risks</h3>
        <ul className="space-y-2 ml-7">
          {content.issues_risks?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Action Items</h3>
        {content.action_items && content.action_items.length > 0 ? (
          <div className="space-y-3">
            {content.action_items.map((item: any, index: number) => (
              <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-2">{item.action}</p>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Assignee: <strong>{item.assignee || "Unassigned"}</strong></span>
                  <span>Due: <strong>{item.due_date || "No deadline"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 ml-7">No action items.</p>
        )}
      </div>
    </div>
  );

  const renderRetrospective = (content: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">
          ✓ What Went Well
        </h3>
        <ul className="space-y-2 ml-7">
          {content.what_went_well?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">
          ✗ What Didn't Go Well
        </h3>
        <ul className="space-y-2 ml-7">
          {content.what_didnt_go_well?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">
          💡 Improvements
        </h3>
        <ul className="space-y-2 ml-7">
          {content.improvements?.map((item: string, index: number) => (
            <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3">
          🎯 Action Points
        </h3>
        {content.action_points && content.action_points.length > 0 ? (
          <div className="space-y-3">
            {content.action_points.map((item: any, index: number) => {
              // Handle both string and object formats
              if (typeof item === 'string') {
                return (
                  <div key={index} className="ml-7 text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{item}</span>
                  </div>
                );
              } else if (typeof item === 'object' && item !== null) {
                return (
                  <div key={index} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {item.task || item.action || item.description || 'Action item'}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.assignee && <span>Assignee: <strong>{item.assignee}</strong></span>}
                      {item.due_date && <span>Due: <strong>{item.due_date}</strong></span>}
                      {item.priority && <span>Priority: <strong>{item.priority}</strong></span>}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 ml-7">No action points.</p>
        )}
      </div>
    </div>
  );

  const renderBrainstorming = (content: any) => (
    <div className="space-y-6">
      {/* Meeting Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
          💡 {content.meeting_topic || "Brainstorming Session"}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Objective:</strong> {content.meeting_objective || "Not specified"}
        </p>
        {content.participants && content.participants.length > 0 && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            <strong>Participants:</strong> {content.participants.join(", ")}
          </p>
        )}
      </div>

      {/* Summary */}
      {content.summary && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {content.summary}
          </p>
        </div>
      )}

      {/* Top Ideas */}
      {content.top_ideas && content.top_ideas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">🌟 Top Ideas</h3>
          <ul className="space-y-2 ml-7">
            {content.top_ideas.map((idea: string, index: number) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-green-600 mt-1">★</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Ideas Generated */}
      {content.ideas_generated && content.ideas_generated.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">💭 Ideas Generated</h3>
          <div className="space-y-3">
            {content.ideas_generated.map((item: any, index: number) => (
              <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-2">{item.idea}</p>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {item.proposed_by && <span>By: <strong>{item.proposed_by}</strong></span>}
                  {item.category && <span>Category: <strong>{item.category}</strong></span>}
                  {item.votes > 0 && <span>Votes: <strong>{item.votes}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Themes */}
      {content.key_themes && content.key_themes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3">🔑 Key Themes</h3>
          <div className="flex flex-wrap gap-2">
            {content.key_themes.map((theme: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {content.categories && content.categories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">📂 Categories</h3>
          <div className="flex flex-wrap gap-2">
            {content.categories.map((category: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Decisions Made */}
      {content.decisions_made && content.decisions_made.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-3">✅ Decisions Made</h3>
          <ul className="space-y-2 ml-7">
            {content.decisions_made.map((decision: any, index: number) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>
                  {typeof decision === 'string' ? decision : decision.decision}
                  {typeof decision === 'object' && decision.assignee && (
                    <span className="ml-2 text-sm text-indigo-600 dark:text-indigo-400">
                      (Assignee: {decision.assignee})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {content.next_steps && content.next_steps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">🚀 Next Steps</h3>
          <div className="space-y-3">
            {content.next_steps.map((item: any, index: number) => (
              <div key={index} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-2">{item.task}</p>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {item.assignee && <span>Assignee: <strong>{item.assignee}</strong></span>}
                  {item.due_date && <span>Due: <strong>{item.due_date}</strong></span>}
                  {item.priority && <span>Priority: <strong>{item.priority}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error || "Report not found"}
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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push(`/transcripts/${report.transcript_id}`)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <FileBarChart className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Version {report.version}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Generated {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                </span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Report
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={exporting}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export DOCX
            </button>
          </div>
        </div>

        {/* Header Image */}
        {report.report_content?.header_image && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <img 
              src={report.report_content.header_image} 
              alt="Report Header" 
              className="w-full max-h-48 object-contain rounded-lg"
            />
          </div>
        )}

        {/* Report Content */}
        <div className="p-8">
          {report.report_type === "daily_standup" && renderDailyStandup(report.report_content)}
          {report.report_type === "sprint_meeting" && renderSprintMeeting(report.report_content)}
          {report.report_type === "retrospective" && renderRetrospective(report.report_content)}
          {report.report_type === "brainstorming" && renderBrainstorming(report.report_content)}
        </div>

        {/* Footer Image */}
        {report.report_content?.footer_image && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <img 
              src={report.report_content.footer_image} 
              alt="Report Footer" 
              className="w-full max-h-48 object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
