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
  sprint_meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};
const CATEGORY_LABELS: Record<string, string> = {
  daily_standup: "Daily Standup",
  sprint_planning: "Sprint Planning",
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
