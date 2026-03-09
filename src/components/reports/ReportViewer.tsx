"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileBarChart, Edit, Download, Calendar, ChevronLeft, 
  FileText, CheckCircle, Clock, AlertTriangle, User 
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

  const renderPersonSection = (people: any[], dotColor: string) => {
    if (!people || people.length === 0) return <p className="text-gray-500 dark:text-gray-400 ml-7">None reported.</p>;

    // Support old flat-string format for backward compatibility
    if (typeof people[0] === 'string') {
      return (
        <ul className="space-y-2 ml-7">
          {people.map((item: string, idx: number) => (
            <li key={idx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className={`${dotColor} mt-1`}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="space-y-4 ml-2">
        {people.map((person: any, idx: number) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                {(person.name || 'U').charAt(0).toUpperCase()}
              </span>
              {person.name || 'Unknown'}
            </p>
            <ul className="space-y-1 ml-9">
              {(person.tasks || []).map((task: string, tIdx: number) => (
                <li key={tIdx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className={`${dotColor} mt-1`}>•</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderDailyStandup = (content: any) => {
    // New developer-centric format
    const teamUpdates = content.team_updates;
    const blockersSummary = content.blockers_summary;

    if (teamUpdates && Array.isArray(teamUpdates) && teamUpdates.length > 0) {
      return (
        <div className="space-y-6">
          {/* Per-developer sections */}
          {teamUpdates.map((dev: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
              {/* Developer header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                  {(dev.name || 'U').charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{dev.name || 'Unknown'}</p>
                  {dev.role && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {dev.role}
                    </p>
                  )}
                </div>
              </div>

              {/* Yesterday's Tasks */}
              {dev.yesterday_tasks && dev.yesterday_tasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Yesterday&apos;s Tasks
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {dev.yesterday_tasks.map((task: string, tIdx: number) => (
                      <li key={tIdx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Today's Tasks */}
              {dev.today_tasks && dev.today_tasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Today&apos;s Tasks
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {dev.today_tasks.map((task: string, tIdx: number) => (
                      <li key={tIdx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blockers */}
              {dev.blockers && dev.blockers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Blockers &amp; Issues
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {dev.blockers.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="text-red-700 dark:text-red-300 flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No blockers message */}
              {(!dev.blockers || dev.blockers.length === 0) && (
                <p className="text-gray-400 dark:text-gray-500 text-sm italic ml-6">No blockers reported.</p>
              )}
            </div>
          ))}

          {/* Blockers Summary */}
          {blockersSummary && blockersSummary.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Blockers Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Title</th>
                      <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Description</th>
                      <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Reported By</th>
                      <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockersSummary.map((bs: any, bsIdx: number) => (
                      <tr key={bsIdx} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{bs.title}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{bs.description || ''}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {bs.reported_by ? bs.reported_by.join(', ') : ''}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{bs.impact || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Legacy fallback: old section-based format
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Yesterday&apos;s Work
          </h3>
          {renderPersonSection(content.yesterday_work, 'text-green-600')}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today&apos;s Plan
          </h3>
          {renderPersonSection(content.today_plan, 'text-blue-600')}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Blockers &amp; Issues
          </h3>
          {content.blockers && content.blockers.length > 0 ? (
            renderPersonSection(content.blockers, 'text-red-600')
          ) : (
            <p className="text-gray-500 dark:text-gray-400 ml-7">No blockers reported.</p>
          )}
        </div>
      </div>
    );
  };

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Task</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Assignee</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {content.action_items.map((item: any, index: number) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.action || item.task}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.assignee || 'Unassigned'}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.due_date || 'No deadline'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {content.action_points.map((item: any, index: number) => {
                  if (typeof item === 'string') {
                    return (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300"></td>
                      </tr>
                    );
                  } else if (typeof item === 'object' && item !== null) {
                    return (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {item.task || item.action || item.description || 'Action item'}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.assignee || ''}</td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Idea</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Proposed By</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Category</th>
                  {content.ideas_generated.some((item: any) => item.votes > 0) && (
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Votes</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {content.ideas_generated.map((item: any, index: number) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.idea}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.proposed_by || ''}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.category || ''}</td>
                    {content.ideas_generated.some((item: any) => item.votes > 0) && (
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.votes || 0}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Decision</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {content.decisions_made.map((item: any, index: number) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {typeof item === 'string' ? item : item.decision}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {typeof item === 'object' ? (item.assignee || '') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {content.next_steps && content.next_steps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">🚀 Next Steps</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Task</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Assignee</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Due Date</th>
                  <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Priority</th>
                </tr>
              </thead>
              <tbody>
                {content.next_steps.map((item: any, index: number) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.task}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.assignee || ''}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.due_date || ''}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.priority || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Generic renderer for template-based reports with dynamic keys
  const formatSectionTitle = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderTemplateSection = (key: string, value: any, displayTitle?: string) => {
    if (key === 'header_image' || key === 'footer_image' || key === '_sections_order') return null;
    const sectionTitle = displayTitle || formatSectionTitle(key);

    if (typeof value === 'string') {
      return (
        <div key={key}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {sectionTitle}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {value}
          </p>
        </div>
      );
    }

    if (Array.isArray(value)) {
      // Array of strings (bullet list)
      if (value.length > 0 && typeof value[0] === 'string') {
        return (
          <div key={key}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {sectionTitle}
            </h3>
            <ul className="space-y-2 ml-7">
              {value.map((item: string, idx: number) => (
                <li key={idx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      // Array of objects (table)
      if (value.length > 0 && typeof value[0] === 'object') {
        const columns = Object.keys(value[0]);
        return (
          <div key={key}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {sectionTitle}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-600 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                        {formatSectionTitle(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {value.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-gray-200 dark:border-gray-600">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  const renderTemplateReport = (content: any) => {
    const sectionsOrder = content._sections_order as Array<{ key: string; title: string; type: string; order: number }> | undefined;

    if (sectionsOrder && sectionsOrder.length > 0) {
      // Render in the exact template order using stored metadata
      return (
        <div className="space-y-6">
          {sectionsOrder
            .sort((a, b) => a.order - b.order)
            .map(({ key, title }) => {
              const value = content[key];
              if (value === undefined) return null;
              return renderTemplateSection(key, value, title);
            })}
        </div>
      );
    }

    // Fallback: iterate keys as-is
    return (
      <div className="space-y-6">
        {Object.entries(content)
          .filter(([key]) => key !== 'header_image' && key !== 'footer_image' && key !== '_sections_order')
          .map(([key, value]) => renderTemplateSection(key, value))}
      </div>
    );
  };

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
                {report.template_id && (
                  <>
                    <span>•</span>
                    <button
                      onClick={() => router.push(`/reports/templates/${report.template_id}`)}
                      className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Template
                    </button>
                  </>
                )}
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
          {report.template_id ? (
            renderTemplateReport(report.report_content)
          ) : (
            <>
              {report.report_type === "daily_standup" && renderDailyStandup(report.report_content)}
              {report.report_type === "sprint_meeting" && renderSprintMeeting(report.report_content)}
              {report.report_type === "retrospective" && renderRetrospective(report.report_content)}
              {report.report_type === "brainstorming" && renderBrainstorming(report.report_content)}
            </>
          )}
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
