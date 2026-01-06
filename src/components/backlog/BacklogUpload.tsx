'use client';

import React, { useState } from 'react';
import { backlogApi, UploadBacklogResponse } from '../../lib/api/backlog.api';

interface BacklogUploadProps {
    projectId: number;
    projectName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function BacklogUpload({ projectId, projectName, onSuccess, onCancel }: BacklogUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadBacklogResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

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

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await backlogApi.uploadFile(projectId, file);
            setResult(response);

            if (response.success && onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Upload Backlog</h2>
                <p className="text-sm text-gray-600">
                    Create backlog items for <span className="font-semibold text-blue-600">{projectName}</span> by uploading an Excel or CSV file
                </p>
            </div>

            {/* File Upload Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 File Format Requirements</h3>
                        <p className="text-xs text-blue-800 mb-2">Your file should include the following columns:</p>
                    </div>
                    <button
                        onClick={() => {
                            // Generate comprehensive CSV template with example data
                            const headers = [
                                'summary',
                                'description',
                                'issue_type',
                                'status',
                                'priority',
                                'severity',
                                'assignee',
                                'story_points',
                                'sprint',
                                'tags'
                            ];

                            const exampleRows = [
                                [
                                    'User Authentication API',
                                    'Implement JWT-based authentication for user login and registration',
                                    'Story',
                                    'To Do',
                                    'High',
                                    '',
                                    'dev@example.com',
                                    '8',
                                    'Sprint 1',
                                    'backend,api,security'
                                ],
                                [
                                    'Add Dashboard Widgets',
                                    'Create reusable widget components for the main dashboard',
                                    'Feature',
                                    'In Progress',
                                    'Medium',
                                    '',
                                    'frontend@example.com',
                                    '5',
                                    'Sprint 1',
                                    'frontend,ui,dashboard'
                                ],
                                [
                                    'Fix Login Page Crash on iOS',
                                    'Application crashes when attempting to login on iOS Safari',
                                    'Bug',
                                    'To Do',
                                    'High',
                                    'Critical',
                                    'qa@example.com',
                                    '3',
                                    'Sprint 2',
                                    'bug,ios,critical'
                                ],
                                [
                                    'Update Database Schema',
                                    'Add new fields for user preferences table',
                                    'Change',
                                    'Done',
                                    'Low',
                                    '',
                                    'dba@example.com',
                                    '2',
                                    'Sprint 1',
                                    'database,schema'
                                ]
                            ];

                            // Create CSV content with proper escaping
                            const csvRows = [headers.join(',')];
                            exampleRows.forEach(row => {
                                const escapedRow = row.map(field => {
                                    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                                        return `"${field.replace(/"/g, '""')}"`;
                                    }
                                    return field;
                                });
                                csvRows.push(escapedRow.join(','));
                            });

                            const csv = csvRows.join('\n');

                            // Download CSV
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `backlog_template_${projectName.replace(/\s+/g, '_')}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors duration-200 flex items-center gap-1.5 shadow-sm"
                        title="Download CSV template with examples"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Template
                    </button>
                </div>
                <ul className="text-xs text-blue-700 space-y-1 ml-4">
                    <li><strong>summary</strong> (required) - Item title</li>
                    <li><strong>issue_type</strong> (required) - story, feature, change, or bug</li>
                    <li><strong>description</strong> - Detailed description</li>
                    <li><strong>status</strong> - To Do, In Progress, Done, etc.</li>
                    <li><strong>priority</strong> - high, medium, or low</li>
                    <li><strong>severity</strong> - Required if issue_type is 'bug'</li>
                    <li><strong>assignee</strong> - Email or name</li>
                    <li><strong>story_points</strong> - Effort estimation (numeric)</li>
                    <li><strong>sprint</strong> - Sprint name or number</li>
                    <li><strong>tags</strong> - Comma-separated tags</li>
                </ul>
            </div>

            {/* File Upload */}
            <div className="mb-6">
                <label htmlFor="backlogFile" className="block text-sm font-semibold text-gray-700 mb-2">
                    Select File
                </label>
                <input
                    type="file"
                    id="backlogFile"
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
                    <h3 className="text-sm font-semibold mb-2 {result.success ? 'text-green-900' : 'text-yellow-900'}">
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
                                <p className="font-semibold mb-1">🎫 Jira Issues Created:</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.jira_issues_created.map((key) => (
                                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
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
                    disabled={!file || uploading}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${!file || uploading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                        }`}
                >
                    {uploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating in Jira...
                        </span>
                    ) : (
                        '🚀 Upload & Create Backlog'
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
