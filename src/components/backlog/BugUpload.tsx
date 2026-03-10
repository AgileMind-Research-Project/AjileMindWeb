'use client';

import React, { useState, useEffect } from 'react';
import { backlogApi, UploadBacklogResponse } from '../../lib/api/backlog.api';
import { API_CONFIG } from '../../lib/config/api.config';

interface Sprint {
    sprint_id: number;
    sprint_name: string;
    sprint_status: string;
}

interface BugUploadProps {
    projectId: number;
    projectName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function BugUpload({ projectId, projectName, onSuccess, onCancel }: BugUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadBacklogResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<number | ''>('');

    // Fetch Sprints
    useEffect(() => {
        const fetchSprints = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken;
                const res = await fetch(`${API_CONFIG.baseURL}/api/v1/projects/${projectId}/sprints`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const sprintList = data.data?.sprints || [];
                    setSprints(sprintList);

                    // Default to first 'Future' sprint if available
                    const futureSprint = sprintList.find((s: Sprint) => s.sprint_status.toLowerCase() === 'future');
                    if (futureSprint) {
                        setSelectedSprintId(futureSprint.sprint_id);
                    } else if (sprintList.length > 0) {
                        setSelectedSprintId(sprintList[0].sprint_id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch sprints', err);
            }
        };
        fetchSprints();
    }, [projectId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

            if (!validExtensions.includes(fileExtension)) {
                setError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file');
                setFile(null);
                return;
            }

            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        if (selectedSprintId === '') {
            setError('Please select a sprint');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await backlogApi.uploadBugs(projectId, selectedSprintId as number, file);
            setResult(response);

            if (response.success && onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || 'Failed to upload bugs');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-red-600 mb-2">🐞 Upload Bugs</h2>
                <p className="text-sm text-gray-600">
                    Upload bugs for <span className="font-semibold text-blue-600">{projectName}</span> by uploading an Excel or CSV file
                </p>
            </div>

            {/* Select Sprint */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Sprint</label>
                <select
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3"
                    value={selectedSprintId}
                    onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                    disabled={uploading}
                >
                    <option value="" disabled>Select a Sprint...</option>
                    {sprints.map((sprint) => (
                        <option key={sprint.sprint_id} value={sprint.sprint_id}>
                            {sprint.sprint_name} ({sprint.sprint_status})
                        </option>
                    ))}
                </select>
            </div>

            {/* File Upload Instructions */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-semibold text-red-900 mb-2">📝 File Format Requirements</h3>
                        <p className="text-xs text-red-800 mb-2">Your file should include the following columns. The issue_type will be forced to &apos;bug&apos; and sprint will be set automatically based on the selection above.</p>
                    </div>
                </div>
                <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                    <li><strong>summary</strong> (required) - Bug title</li>
                    <li><strong>description</strong> - Detailed description</li>
                    <li><strong>priority</strong> - high, medium, or low</li>
                    <li><strong>severity</strong> - Required severity level (Critical, High, Medium, Low)</li>
                    <li><strong>assignee</strong> - Email or name</li>
                    <li><strong>tags</strong> - Comma-separated tags</li>
                </ul>
            </div>

            {/* File Upload */}
            <div className="mb-6">
                <label htmlFor="bugFile" className="block text-sm font-semibold text-gray-700 mb-2">
                    Select File
                </label>
                <input
                    type="file"
                    id="bugFile"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3"
                />
                {file && (
                    <p className="mt-2 text-sm text-green-600">
                        ✅ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">❌ {error}</p>
                </div>
            )}

            {/* Result Display */}
            {result && (
                <div className={`mb-6 p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}>
                    <h3 className={`text-sm font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-yellow-900'}`}>
                        {result.success ? '✅ Upload Successful!' : '⚠️ Partial Success'}
                    </h3>
                    <div className="text-sm space-y-1">
                        <p className={result.success ? 'text-green-800' : 'text-yellow-800'}>
                            <strong>Processed:</strong> {result.items_processed} items
                        </p>
                        <p className={result.success ? 'text-green-800' : 'text-yellow-800'}>
                            <strong>Created:</strong> {result.items_created} items
                        </p>

                        {result.jira_issues_created && result.jira_issues_created.length > 0 && (
                            <div className="mt-3">
                                <p className="font-semibold mb-1">🎫 Jira Bugs Created:</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.jira_issues_created.map((key) => (
                                        <span key={key} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                                            {key}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <div className="mt-3">
                                <p className="font-semibold text-red-700 mb-1">⚠️ Errors:</p>
                                <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                                    {result.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading || selectedSprintId === ''}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${(!file || uploading || selectedSprintId === '')
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                        }`}
                >
                    {uploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Bugs...
                        </span>
                    ) : (
                        '🚀 Upload & Link Bugs'
                    )}
                </button>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={uploading}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
