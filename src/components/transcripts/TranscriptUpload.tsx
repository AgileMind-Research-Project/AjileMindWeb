"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Calendar, Tag, X } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

export default function TranscriptUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "daily_standup" as "daily_standup" | "sprint_meeting" | "retrospective",
    transcriptDate: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    pastedContent: "",
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['.txt', '.pdf', '.docx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(fileExt)) {
        setError("Invalid file type. Please upload .txt, .pdf, or .docx files.");
        return;
      }
      
      setSelectedFile(file);
      setError("");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("transcript_date", formData.transcriptDate);
      formDataToSend.append("tags", JSON.stringify(formData.tags));

      if (uploadMethod === "file") {
        if (!selectedFile) {
          setError("Please select a file to upload");
          setLoading(false);
          return;
        }
        formDataToSend.append("file", selectedFile);
      } else {
        if (!formData.pastedContent.trim()) {
          setError("Please paste transcript content");
          setLoading(false);
          return;
        }
        formDataToSend.append("pasted_content", formData.pastedContent);
      }

      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE}/api/v1/transcripts/upload`, {
        method: "POST",
        headers,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload transcript");
      }

      const result = await response.json();
      
      // Redirect to transcript detail page
      router.push(`/transcripts/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to upload transcript");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Upload Transcript
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Daily Standup - Jan 15, 2025"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value as "daily_standup" | "sprint_meeting" | "retrospective"
              }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="daily_standup">Daily Standup</option>
              <option value="sprint_meeting">Sprint Meeting</option>
              <option value="retrospective">Retrospective</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Meeting Date *
            </label>
            <input
              type="date"
              required
              value={formData.transcriptDate}
              onChange={(e) => setFormData(prev => ({ ...prev, transcriptDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="inline w-4 h-4 mr-2" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <X
                    className="w-4 h-4 cursor-pointer hover:text-blue-600"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Upload Method Toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod("file")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  uploadMethod === "file"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Upload className="inline w-4 h-4 mr-2" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod("paste")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  uploadMethod === "paste"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <FileText className="inline w-4 h-4 mr-2" />
                Paste Text
              </button>
            </div>

            {uploadMethod === "file" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File (.txt, .pdf, .docx) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  {selectedFile ? (
                    <p className="text-gray-700 dark:text-gray-300">
                      Selected: {selectedFile.name}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Click to select file or drag and drop
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste Transcript Content *
                </label>
                <textarea
                  value={formData.pastedContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, pastedContent: e.target.value }))}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder="Paste your transcript text here..."
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload Transcript"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
