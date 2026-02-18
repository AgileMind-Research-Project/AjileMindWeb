"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calendar, Tag, Edit, Trash2, FileBarChart, ChevronRight, Sparkles } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';
import ReportGenerator from "../reports/ReportGenerator";
import ParsedDataReviewModal from "../meetings/ParsedDataReviewModal";

const API_BASE = 'http://localhost:8000';

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
}

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

interface TranscriptDetailProps {
  transcriptId: number;
}

export default function TranscriptDetail({ transcriptId }: TranscriptDetailProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (hasHydrated && accessToken) {
      fetchTranscript();
      fetchReports();
    }
  }, [transcriptId, hasHydrated, accessToken, isAuthenticated]);

  const fetchTranscript = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/transcripts/${transcriptId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }

      const data = await response.json();
      setTranscript(data);
    } catch (err: any) {
      setError(err.message || "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/reports/transcript/${transcriptId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transcript? This will also delete all associated reports.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/transcripts/${transcriptId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete transcript");
      }

      router.push("/transcripts");
    } catch (err: any) {
      alert(err.message || "Failed to delete transcript");
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      daily_standup: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      sprint_planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      sprint_meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      retrospective: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };

    const labels = {
      daily_standup: "Daily Standup",
      sprint_planning: "Sprint Planning",
      sprint_meeting: "Sprint Meeting",
      retrospective: "Retrospective"
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
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading transcript...</p>
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

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {transcript.title}
                  </h1>
                  {getCategoryBadge(transcript.category)}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(transcript.transcript_date).toLocaleDateString()}
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
                      {transcript.tags.map((tag, index) => (
                        <span
                          key={index}
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
                  onClick={() => setShowParseModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Parse with AI
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Transcript Content
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {transcript.transcript_content}
              </pre>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generated Reports ({reports.length})
              </h2>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <FileBarChart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No reports generated yet</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Generate your first report
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => router.push(`/reports/${report.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileBarChart className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Version {report.version} • Generated {new Date(report.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(report.status)}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* Parse Data Modal */}
      {showParseModal && (
        <ParsedDataReviewModal
          transcriptId={transcriptId}
          projectId={(transcript as any).project_id}
          onClose={() => setShowParseModal(false)}
          onSyncComplete={() => {
            setShowParseModal(false);
            fetchReports(); // Refresh reports or other data if needed
          }}
        />
      )}
    </>
  );
}
