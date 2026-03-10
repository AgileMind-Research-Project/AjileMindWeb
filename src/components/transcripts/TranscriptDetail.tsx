"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Calendar, Tag, Trash2,
  ChevronDown, ChevronUp, RefreshCw, Sparkles,
  User, Clock, Pencil, Check, X, AlertCircle, Edit, FileBarChart, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import ReportGenerator from "@/components/reports/ReportGenerator";

const API_BASE = "http://localhost:8000";

// ─── interfaces ──────────────────────────────────────────────────────────────

interface Transcript {
  id: number;
  title: string;
  category: string;
  transcript_content: string;
  transcript_date: string;
  tags: string[] | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
  project_id?: number | null;
}

interface AnalyzedTask {
  task_id: string | null;
  summary: string | null;
  description: string | null;
  effort: number | null;
  assignee: string | null;
  tags: string[] | null;
  meeting_status?: string | null;
  database_status?: string | null;
}

interface LeaveEntry {
  developer_name: string;
  leave_date: string | null;
  leave_hours: number | null;
  leave_type: string;
  reason: string | null;
}

interface BugEntry {
  title: string;
  reporter: string;
  severity: string;
  description: string;
}

interface Project {
  project_id: number;
  project_name: string;
  key: string;
}

interface ProjectUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface TaskState {
  expanded: boolean;
  editTaskId: string;
  editAssignee: string;
  users: ProjectUser[];
  usersLoaded: boolean;
}

interface Report {
  id: number;
  transcript_id: number;
  report_type: string;
  template_id: number | null;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TranscriptDetailProps {
  transcriptId: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  daily_standup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  sprint_planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  sprint_review: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  sprint_meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};
const CATEGORY_LABELS: Record<string, string> = {
  daily_standup: "Daily Standup",
  sprint_planning: "Sprint Planning",
  sprint_review: "Sprint Review",
  sprint_meeting: "Sprint Meeting",
  retrospective: "Retrospective",
  other: "Other",
};

function formatEffort(effort: number | null): string {
  if (effort == null) return "—";
  const h = effort % 1 === 0 ? effort : Number.parseFloat(effort.toFixed(1));
  return `${h}h`;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function TranscriptDetail({ transcriptId }: Readonly<TranscriptDetailProps>) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // core data
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // transcript panel
  const [contentExpanded, setContentExpanded] = useState(false);

  // projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [tasks, setTasks] = useState<AnalyzedTask[]>([]);
  const [leaveInfo, setLeaveInfo] = useState<LeaveEntry[]>([]);
  const [bugs, setBugs] = useState<BugEntry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // per-task UI state
  const [taskStates, setTaskStates] = useState<Record<number, TaskState>>({});

  // ── auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (hasHydrated && accessToken) {
      fetchTranscript();
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptId, hasHydrated, accessToken, isAuthenticated]);

  // ── auto-analyse once transcript is loaded ───────────────────────────────
  useEffect(() => {
    if (transcript?.id && accessToken) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript?.id]);

  // ── data fetchers ────────────────────────────────────────────────────────
  const fetchTranscript = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/transcripts/${transcriptId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch transcript");
      const data = await res.json();
      setTranscript(data);
      if (data.project_id) setSelectedProjectId(data.project_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.data || []);
    } catch { /* silent */ }
  };

  const runAnalysis = async () => {
    if (!accessToken) return;
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzed(false);
    try {
      const res = await fetch(`${API_BASE}/api/v1/transcripts/${transcriptId}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error((body as { detail?: string }).detail || "Analysis failed");
      }
      const data = await res.json();
      const fetchedTasks: AnalyzedTask[] = data.tasks || [];
      const fetchedLeaves: LeaveEntry[] = data.leave_info || [];
      const fetchedBugs: BugEntry[] = data.bugs || [];

      setTasks(fetchedTasks);
      setLeaveInfo(fetchedLeaves);
      setBugs(fetchedBugs);
      setAnalyzed(true);

      // init per-task UI state
      const init: Record<number, TaskState> = {};
      fetchedTasks.forEach((t, i) => {
        init[i] = {
          expanded: false,
          editTaskId: t.task_id ?? "",
          editAssignee: t.assignee ?? "",
          users: [],
          usersLoaded: false,
        };
      });
      setTaskStates(init);
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadProjectUsers = async (projectId: number, idx: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/projects/${projectId}/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setTaskStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], users: data.data?.users || [], usersLoaded: true },
      }));
    } catch {
      setTaskStates((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], users: [], usersLoaded: true },
      }));
    }
  };

  const toggleExpand = (idx: number) => {
    const wasExpanded = taskStates[idx]?.expanded;
    setTaskStates((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        expanded: !wasExpanded,
        editTaskId: tasks[idx]?.task_id ?? "",
        editAssignee: tasks[idx]?.assignee ?? "",
      },
    }));
    if (!wasExpanded && selectedProjectId && !taskStates[idx]?.usersLoaded) {
      loadProjectUsers(selectedProjectId, idx);
    }
  };

  const updateTaskState = (idx: number, patch: Partial<TaskState>) =>
    setTaskStates((prev) => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/reports/?transcript_id=${transcriptId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setReports(data.reports || []);
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transcript? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/transcripts/${transcriptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete transcript");
      router.push("/transcripts");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete transcript");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading transcript…</p>
        </div>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error || "Transcript not found"}
          </div>
        </div>
      </div>
    );
  }

  const categoryStyle = CATEGORY_STYLES[transcript.category] ?? CATEGORY_STYLES.other;
  const categoryLabel = CATEGORY_LABELS[transcript.category] ?? "Other";

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transcript.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryStyle}`}>
                  {categoryLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(transcript.transcript_date).toLocaleDateString("en-US", {
                    weekday: "short", year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
                {transcript.file_name && (
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {transcript.file_name}
                  </span>
                )}
              </div>

              {transcript.tags && transcript.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {transcript.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileBarChart className="w-4 h-4" />
                Report
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* ── AI Analysis Block ────────────────────────────────────────────── */}
        {analyzed && (tasks.length > 0 || leaveInfo.length > 0 || bugs.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-purple-100 dark:border-purple-900/30 overflow-hidden">
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 border-b border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Task & {['sprint_review', 'sprint_meeting'].includes((transcript.category || '').toLowerCase()) ? 'Bug' : 'Leave'} Status
              </h2>
              <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200">
                {tasks.length} Tasks Detected
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Tasks List */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Detected Updates
                  </h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    {tasks.map((task, idx) => {
                      const isExpanded = taskStates[idx]?.expanded;
                      return (
                        <div key={idx} className="bg-white dark:bg-gray-800">
                          <button
                            onClick={() => toggleExpand(idx)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                          >
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{task.task_id || 'NEW'}</span>
                            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{task.summary}</span>

                            {task.meeting_status && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase
                                ${task.meeting_status.toLowerCase().includes('complete') && !task.meeting_status.toLowerCase().includes('incomplete')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {task.meeting_status}
                              </span>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-11 py-5 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 space-y-4">
                              <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Observation</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-3 border-purple-200 pl-3">
                                  {task.description || "Mentioned in discussion."}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 shadow-sm">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Meeting Status</p>
                                  <p className="text-sm font-bold text-blue-600">{task.meeting_status || "Mentioned"}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 shadow-sm">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">DB Sync Status</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{task.database_status || "New"}</p>
                                    {task.meeting_status && task.database_status && task.meeting_status.toLowerCase() !== task.database_status.toLowerCase() && (
                                      <span className="text-[9px] bg-rose-100 text-rose-600 px-1 rounded font-bold">Inconsistent</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-medium text-gray-500 pt-2 border-t border-gray-100">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" /> {task.assignee || 'Unassigned'}</span>
                                {task.effort ? <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /> {task.effort}h</span> : null}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaves / Bugs Column */}
                <div className="lg:col-span-2 space-y-4">
                  {['sprint_review', 'sprint_meeting'].includes((transcript.category || '').toLowerCase()) ? (
                    <>
                      <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                        Bug Reports
                      </h3>
                      <div className="space-y-2">
                        {bugs.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 italic">No bugs detected.</p>
                          </div>
                        ) : (
                          bugs.map((b, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${b.severity === 'High' ? 'bg-rose-100 text-rose-700' :
                                  b.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                  {b.severity} Severity
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                  <User className="w-3 h-3" /> {b.reporter}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{b.title}</p>
                              <p className="text-xs text-gray-500 leading-tight">{b.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        Leave Entries
                      </h3>
                      <div className="space-y-2">
                        {leaveInfo.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 italic">No leave detected.</p>
                          </div>
                        ) : (
                          leaveInfo.map((l, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                                  {l.developer_name[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold truncate max-w-[120px]">{l.developer_name}</p>
                                  <p className="text-[10px] text-gray-500 font-medium">{l.leave_date} • {l.leave_hours}h</p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold uppercase">{l.reason || "Out"}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Raw Transcript ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setContentExpanded(v => !v)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Raw Transcript
            </h2>
            {contentExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {contentExpanded && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900/20">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-100 dark:border-gray-800 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {transcript.transcript_content}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {showGenerateModal && (
        <ReportGenerator
          transcriptId={transcriptId}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={(reportId) => {
            setShowGenerateModal(false);
            fetchReports();
            router.push(`/reports/${reportId}`);
          }}
        />
      )}
    </>
  );
}
