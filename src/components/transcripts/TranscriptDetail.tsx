"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Calendar, Tag, Trash2,
  ChevronDown, ChevronUp, RefreshCw, Sparkles,
  User, Clock, Pencil, Check, X, AlertCircle, Edit, FileBarChart, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

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
}

interface LeaveEntry {
  developer_name: string;
  leave_date: string | null;
  leave_hours: number | null;
  leave_type: string;
  reason: string | null;
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

interface TranscriptDetailProps {
  transcriptId: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  daily_standup:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  sprint_planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  sprint_meeting:  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  retrospective:   "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  other:           "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};
const CATEGORY_LABELS: Record<string, string> = {
  daily_standup:   "Daily Standup",
  sprint_planning: "Sprint Planning",
  sprint_meeting:  "Sprint Meeting",
  retrospective:   "Retrospective",
  other:           "Other",
};

function formatEffort(effort: number | null): string {
  if (effort == null) return "—";
  const h = effort % 1 === 0 ? effort : Number.parseFloat(effort.toFixed(1));
  return `${h}h`;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function TranscriptDetail({ transcriptId }: Readonly<TranscriptDetailProps>) {
  const router = useRouter();
  const accessToken     = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated     = useAuthStore((s) => s._hasHydrated);

  // core data
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // transcript panel
  const [contentExpanded, setContentExpanded] = useState(false);

  // projects
  const [projects, setProjects]               = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // analysis
  const [analyzing, setAnalyzing]       = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzed, setAnalyzed]         = useState(false);
  const [tasks, setTasks]               = useState<AnalyzedTask[]>([]);
  const [leaveInfo, setLeaveInfo]       = useState<LeaveEntry[]>([]);
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
      const fetchedLeaves: LeaveEntry[]  = data.leave_info || [];
      setTasks(fetchedTasks);
      setLeaveInfo(fetchedLeaves);
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

  const applyTaskEdit = (idx: number) => {
    const s = taskStates[idx];
    setTasks((prev) =>
      prev.map((t, i) =>
        i === idx
          ? { ...t, task_id: s.editTaskId || t.task_id, assignee: s.editAssignee || t.assignee }
          : t
      )
    );
    updateTaskState(idx, { expanded: false });
  };

  const discardTaskEdit = (idx: number) =>
    updateTaskState(idx, {
      expanded: false,
      editTaskId: tasks[idx]?.task_id ?? "",
      editAssignee: tasks[idx]?.assignee ?? "",
    });

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

  const getCategoryBadge = (category: string) => {
    const styles = {
      daily_standup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      sprint_planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      sprint_meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      brainstorming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    };

    const labels = {
      daily_standup: "Daily Standup",
      sprint_planning: "Sprint Planning",
      sprint_meeting: "Sprint Meeting",
      retrospective: "Retrospective",
      brainstorming: "Brainstorming"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[category as keyof typeof styles]}`}>
        {labels[category as keyof typeof labels]}
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
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <FileBarChart className="w-4 h-4" />
                  Generate Report
                </button>
                 <button
            onClick={handleDelete}
            className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
          </div>

      {/* ── Transcript content (collapsed by default) ─────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setContentExpanded((v) => !v)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Transcript Content
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
              ({transcript.transcript_content.length.toLocaleString()} characters)
            </span>
          </h2>
          {contentExpanded
            ? <ChevronUp className="w-5 h-5 text-gray-400" />
            : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {contentExpanded && (
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {transcript.transcript_content}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Analysis ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">

        {/* Analysis header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Task Analysis
            </h2>
            {analyzed && !analyzing && (
              <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                {tasks.length} task{tasks.length === 1 ? "" : "s"} found
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Project selector */}
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select project for assignees</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  [{p.key}] {p.project_name}
                </option>
              ))}
            </select>

            {/* Re-run button */}
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "Analysing…" : "Re-run Analysis"}
            </button>
          </div>
        </div>

        {/* ── Full-panel spinner while analysing ─────────────────────────── */}
        {analyzing && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
              Analysing transcript with AI…
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              This may take up to a minute. Please wait.
            </p>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {!analyzing && analyzeError && (
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Analysis failed</p>
                <p className="text-sm mt-0.5">{analyzeError}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────────── */}
        {!analyzing && analyzed && (
          <div className="p-6 space-y-6">

            {/* Tasks */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Extracted Tasks
              </h3>

              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No tasks were extracted from this transcript.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, idx) => {
                    const ts: TaskState = taskStates[idx] ?? {
                      expanded: false,
                      editTaskId: task.task_id ?? "",
                      editAssignee: task.assignee ?? "",
                      users: [],
                      usersLoaded: false,
                    };

                    return (
                      <div
                        key={`task-${task.task_id ?? idx}`}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Task row */}
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                          {/* Task ID */}
                          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-md text-xs font-bold font-mono shrink-0">
                            {task.task_id ?? "—"}
                          </span>

                          {/* Summary + assignee */}
                          <div className="flex-1 min-w-0">
                            {task.summary && (
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {task.summary}
                              </p>
                            )}
                            {task.assignee && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee}
                              </p>
                            )}
                          </div>

                          {/* Effort */}
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-md text-xs font-semibold shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatEffort(task.effort)}
                          </span>

                          {/* View Details toggle */}
                          <button
                            onClick={() => toggleExpand(idx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-colors shrink-0"
                          >
                            {ts.expanded
                              ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
                              : <><ChevronDown className="w-3.5 h-3.5" /> View Details</>}
                          </button>
                        </div>

                        {/* Expanded detail */}
                        {ts.expanded && (
                          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">

                            {task.description && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Description
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                            )}

                            {task.tags && task.tags.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                  Tags
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {task.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Edit row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                              {/* Edit Task ID */}
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                  <Pencil className="w-3 h-3" /> Task ID
                                </label>
                                <input
                                  type="text"
                                  value={ts.editTaskId}
                                  onChange={(e) => updateTaskState(idx, { editTaskId: e.target.value })}
                                  placeholder="e.g. TAM-198"
                                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Assign user */}
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                  <User className="w-3 h-3" /> Assignee
                                </label>
                                {ts.usersLoaded ? (
                                  <select
                                    value={ts.editAssignee}
                                    onChange={(e) => updateTaskState(idx, { editAssignee: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Unassigned —</option>
                                    {ts.users.map((u) => (
                                      <option key={u.user_id} value={u.email}>
                                        {u.first_name} {u.last_name} ({u.email})
                                      </option>
                                    ))}
                                    {ts.editAssignee && !ts.users.some((u) => u.email === ts.editAssignee) && (
                                      <option value={ts.editAssignee}>{ts.editAssignee}</option>
                                    )}
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 py-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Loading project members…
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Save / Discard */}
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => discardTaskEdit(idx)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                              >
                                <X className="w-3.5 h-3.5" /> Discard
                              </button>
                              <button
                                onClick={() => applyTaskEdit(idx)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                              >
                                <Check className="w-3.5 h-3.5" /> Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leave info */}
            {leaveInfo.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Leave Information ({leaveInfo.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Developer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {leaveInfo.map((leave, li) => (
                        <tr key={`leave-${leave.developer_name}-${li}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{leave.developer_name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{leave.leave_date ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{formatEffort(leave.leave_hours)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded text-xs font-medium">
                              {leave.leave_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{leave.reason ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Pre-analysis placeholder (before first auto-run) ───────────── */}
        {!analyzing && !analyzed && !analyzeError && (
          <div className="p-12 text-center text-gray-400 dark:text-gray-600">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Starting AI analysis…</p>
          </div>
        )}
      </div>
  </div>
      {/* Generate Report Modal */}
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
