/**
 * Document Upload Component
 * 
 * Handles document file uploads for RAG chatbot context
 * - File upload with drag-and-drop support
 * - Document title and category input
 * - Upload progress tracking
 * - Success/error notifications
 * - List of previously uploaded documents
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, FileText, Trash2, AlertCircle, CheckCircle2, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

interface UploadedDocument {
  id: string;
  doc_title: string;
  category?: string;
  uploaded_date: string;
  is_active: boolean;
}

export default function DocumentUpload() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('daily_standup');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch uploaded documents on mount
  React.useEffect(() => {
    fetchUploadedDocuments();
  }, [accessToken]);

  const fetchUploadedDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/v1/documents', {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setUploadedDocuments(data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesSelected(droppedFiles);
  }, []);

  const handleFilesSelected = (selectedFiles: File[]) => {
    // Filter valid file types
    const validFiles = selectedFiles.filter((file) => {
      const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.txt') || file.name.endsWith('.docx');
    });

    if (validFiles.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select PDF, TXT, or DOCX files only',
      });
      return;
    }

    setFiles(validFiles);
    setMessage({ type: null, text: '' });

    // Auto-fill title from first file if empty
    if (!title && validFiles[0]) {
      setTitle(validFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!files.length || !title.trim()) {
      setMessage({
        type: 'error',
        text: 'Please select a file and enter a title',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('file', file);
      });
      formData.append('doc_title', title);
      formData.append('category', category);

      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      setUploadProgress(100);
      setMessage({
        type: 'success',
        text: `Successfully uploaded "${title}"`,
      });

      // Reset form
      setFiles([]);
      setTitle('');
      setCategory('general');
      setUploadProgress(0);

      // Refresh document list
      await fetchUploadedDocuments();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: null, text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/v1/documents/${docId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setMessage({
        type: 'success',
        text: 'Document deleted successfully',
      });

      // Refresh document list
      await fetchUploadedDocuments();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Delete failed',
      });
    }
  };

  const categories = [
    { value: 'daily_standup', label: 'Daily Standup' },
    { value: 'sprint_meeting', label: 'Sprint Meeting' },
    { value: 'retrospective', label: 'Retrospective' },
    { value: 'brainstorming', label: 'Brainstorming' },
  ];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Document
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))}
              className="hidden"
            />

            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-900 font-medium">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Drag files here or click to select'}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Supported formats: PDF, TXT, DOCX
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{file.name}</span>
                      <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Requirements Document"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Message Alerts */}
          {message.type && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success'
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !files.length || !title.trim()}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              uploading || !files.length || !title.trim()
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>

      {/* Documents List Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)}
          className="w-full px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Uploaded Documents
            {uploadedDocuments.length > 0 && (
              <span className="text-sm font-normal text-gray-500">({uploadedDocuments.length})</span>
            )}
          </h3>
          {isDocumentsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isDocumentsExpanded && (
          <>
            {loadingDocuments ? (
              <div className="px-6 py-8 text-center">
                <Loader className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-2">Loading documents...</p>
              </div>
            ) : uploadedDocuments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{doc.doc_title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {doc.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                            {doc.category}
                          </span>
                        )}
                        <span>Uploaded: {new Date(doc.uploaded_date).toLocaleDateString()}</span>
                        {!doc.is_active && (
                          <span className="text-red-600 italic">Deleted</span>
                        )}
                      </div>
                    </div>
                    {doc.is_active && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
