import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { RAGDocument } from './types';
import { ragApi } from './rag.api';
import { toast } from 'sonner';

interface DocumentUploadProps {
  documents: RAGDocument[];
  onUploadSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function DocumentUpload({ documents, onUploadSuccess, onDeleteSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    document_type: 'stand_up_doc',
    upload_date: new Date().toISOString().split('T')[0],
  });

  // Document type options for dropdown
  const documentTypes = [
    { value: 'stand_up_doc', label: 'Stand-up' },
    { value: 'retro_summary', label: 'Retrospective Summary' },
    { value: 'sprint_notes', label: 'Sprint Notes' },
    { value: 'task_list', label: 'Task List' },
    { value: 'meeting_notes', label: 'Meeting Notes' },
    { value: 'other', label: 'Other' },
  ];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    // Store file and show metadata form
    setSelectedFile(file);
    setShowMetadataForm(true);
  }, []);

  const handleMetadataSubmit = useCallback(async () => {
    if (!selectedFile) return;
    if (!metadata.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await ragApi.uploadDocument(
        selectedFile,
        metadata.title,
        metadata.document_type,
        metadata.upload_date,
        (p) => setProgress(p)
      );
      toast.success('Document uploaded successfully');
      onUploadSuccess();
      
      // Reset form
      setShowMetadataForm(false);
      setSelectedFile(null);
      setMetadata({
        title: '',
        document_type: 'stand_up_doc',
        upload_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [selectedFile, metadata, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: uploading,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await ragApi.deleteDocument(id);
      toast.success('Document deleted');
      onDeleteSuccess();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Metadata Form Modal */}
      {showMetadataForm && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Metadata</h2>
            
            {/* File Preview */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Document Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Sprint 15 Standup"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>

            {/* Document Type Dropdown */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Document Type *
              </label>
              <select
                value={metadata.document_type}
                onChange={(e) => setMetadata({ ...metadata, document_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Date Picker */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload Date
              </label>
              <input
                type="date"
                value={metadata.upload_date}
                onChange={(e) => setMetadata({ ...metadata, upload_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMetadataForm(false);
                  setSelectedFile(null);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMetadataSubmit}
                disabled={uploading || !metadata.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? `Uploading... ${progress}%` : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            {isDragActive ? 'Drop PDF here' : 'Click or drag PDF to upload'}
          </p>
          <p className="text-xs text-gray-500">PDF files only (max 10MB)</p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Uploaded Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-red-50 rounded">
                    <FileText className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {doc.status === 'processing' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                  {doc.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
