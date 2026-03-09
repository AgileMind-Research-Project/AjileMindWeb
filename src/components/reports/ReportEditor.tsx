"use client";

import { useState, useEffect, useRef } from "react";
import { Save, X, Plus, Trash2, Loader2, ImagePlus, Image, CheckCircle, Clock, AlertTriangle, User } from "lucide-react";
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE = 'http://localhost:8000';

interface ReportEditorProps {
  reportId: number;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReportEditor({ reportId, onSave, onCancel }: ReportEditorProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  const [report, setReport] = useState<any>(null);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Header and Footer Images
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<string | null>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      fetchReport();
    }
  }, [reportId, hasHydrated, accessToken]);

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
      setEditedContent(JSON.parse(JSON.stringify(data.report_content))); // Deep clone
      
      // Load existing header/footer images from report content
      if (data.report_content?.header_image) {
        setHeaderImage(data.report_content.header_image);
      }
      if (data.report_content?.footer_image) {
        setFooterImage(data.report_content.footer_image);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Include header/footer images in the content
      const contentWithImages = {
        ...editedContent,
        header_image: headerImage,
        footer_image: footerImage,
      };
      
      const response = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(contentWithImages),
      });

      if (!response.ok) {
        throw new Error("Failed to save report");
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  // Helper to ensure field is an array
  const ensureArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value];
    return [];
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setEditedContent((prev: any) => {
      const arr = ensureArray(prev[field]);
      return {
        ...prev,
        [field]: arr.map((item: any, i: number) => i === index ? value : item)
      };
    });
  };

  const addArrayItem = (field: string) => {
    setEditedContent((prev: any) => {
      const arr = ensureArray(prev[field]);
      return {
        ...prev,
        [field]: [...arr, ""]
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditedContent((prev: any) => {
      const arr = ensureArray(prev[field]);
      return {
        ...prev,
        [field]: arr.filter((_: any, i: number) => i !== index)
      };
    });
  };

  // Helper to get array for rendering
  const getArrayField = (field: string): any[] => {
    return ensureArray(editedContent?.[field]);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'header') {
        setHeaderImage(base64);
      } else {
        setFooterImage(base64);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Render Header/Footer Image Section
  const renderImageUploadSection = () => (
    <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Report Header & Footer Images
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {/* Header Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Header Image
          </label>
          <div 
            onClick={() => headerInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            {headerImage ? (
              <div className="relative">
                <img 
                  src={headerImage} 
                  alt="Header Preview" 
                  className="max-h-32 mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setHeaderImage(null); }}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload header image
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={headerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'header')}
            className="hidden"
          />
        </div>

        {/* Footer Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Footer Image
          </label>
          <div 
            onClick={() => footerInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            {footerImage ? (
              <div className="relative">
                <img 
                  src={footerImage} 
                  alt="Footer Preview" 
                  className="max-h-32 mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFooterImage(null); }}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload footer image
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={footerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'footer')}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  // ===== Developer-centric standup editing helpers =====
  const getTeamUpdates = (): any[] => {
    const updates = editedContent?.team_updates;
    if (Array.isArray(updates) && updates.length > 0) return updates;
    // Legacy format migration for editing
    if (editedContent?.yesterday_work || editedContent?.today_plan || editedContent?.blockers) {
      const personMap: Record<string, any> = {};
      for (const [field, target] of [['yesterday_work', 'yesterday_tasks'], ['today_plan', 'today_tasks'], ['blockers', 'blockers']] as const) {
        const items = editedContent?.[field] || [];
        for (const item of items) {
          if (typeof item === 'object' && item.name) {
            if (!personMap[item.name]) personMap[item.name] = { name: item.name, role: '', yesterday_tasks: [], today_tasks: [], blockers: [] };
            personMap[item.name][target] = item.tasks || [];
          }
        }
      }
      return Object.values(personMap).length > 0 ? Object.values(personMap) : [{ name: '', role: '', yesterday_tasks: [''], today_tasks: [''], blockers: [] }];
    }
    return [{ name: '', role: '', yesterday_tasks: [''], today_tasks: [''], blockers: [] }];
  };

  const updateDevField = (devIdx: number, field: string, value: any) => {
    setEditedContent((prev: any) => {
      const updates = [...(prev.team_updates || getTeamUpdates())];
      updates[devIdx] = { ...updates[devIdx], [field]: value };
      return { ...prev, team_updates: updates };
    });
  };

  const updateDevTask = (devIdx: number, taskField: string, taskIdx: number, value: string) => {
    setEditedContent((prev: any) => {
      const updates = [...(prev.team_updates || getTeamUpdates())];
      const tasks = [...(updates[devIdx]?.[taskField] || [])];
      tasks[taskIdx] = value;
      updates[devIdx] = { ...updates[devIdx], [taskField]: tasks };
      return { ...prev, team_updates: updates };
    });
  };

  const addDevTask = (devIdx: number, taskField: string) => {
    setEditedContent((prev: any) => {
      const updates = [...(prev.team_updates || getTeamUpdates())];
      const tasks = [...(updates[devIdx]?.[taskField] || []), ''];
      updates[devIdx] = { ...updates[devIdx], [taskField]: tasks };
      return { ...prev, team_updates: updates };
    });
  };

  const removeDevTask = (devIdx: number, taskField: string, taskIdx: number) => {
    setEditedContent((prev: any) => {
      const updates = [...(prev.team_updates || getTeamUpdates())];
      const tasks = (updates[devIdx]?.[taskField] || []).filter((_: any, i: number) => i !== taskIdx);
      updates[devIdx] = { ...updates[devIdx], [taskField]: tasks };
      return { ...prev, team_updates: updates };
    });
  };

  const addDeveloper = () => {
    setEditedContent((prev: any) => ({
      ...prev,
      team_updates: [...(prev.team_updates || getTeamUpdates()), { name: '', role: '', yesterday_tasks: [''], today_tasks: [''], blockers: [] }]
    }));
  };

  const removeDeveloper = (devIdx: number) => {
    setEditedContent((prev: any) => ({
      ...prev,
      team_updates: (prev.team_updates || []).filter((_: any, i: number) => i !== devIdx)
    }));
  };

  // Blockers summary editing helpers
  const getBlockersSummary = (): any[] => editedContent?.blockers_summary || [];

  const updateBlockerSummary = (bsIdx: number, field: string, value: any) => {
    setEditedContent((prev: any) => {
      const summary = [...(prev.blockers_summary || [])];
      summary[bsIdx] = { ...summary[bsIdx], [field]: value };
      return { ...prev, blockers_summary: summary };
    });
  };

  const addBlockerSummary = () => {
    setEditedContent((prev: any) => ({
      ...prev,
      blockers_summary: [...(prev.blockers_summary || []), { title: '', description: '', reported_by: [], impact: '' }]
    }));
  };

  const removeBlockerSummary = (bsIdx: number) => {
    setEditedContent((prev: any) => ({
      ...prev,
      blockers_summary: (prev.blockers_summary || []).filter((_: any, i: number) => i !== bsIdx)
    }));
  };

  const renderTaskListEditor = (devIdx: number, taskField: string, label: string, icon: React.ReactNode, color: string) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <h4 className={`text-sm font-semibold ${color} flex items-center gap-1`}>
          {icon} {label}
        </h4>
        <button type="button" onClick={() => addDevTask(devIdx, taskField)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="space-y-1.5 ml-4">
        {((editedContent?.team_updates || getTeamUpdates())[devIdx]?.[taskField] || []).map((task: string, tIdx: number) => (
          <div key={tIdx} className="flex gap-2">
            <input type="text" value={task || ''}
              onChange={(e) => updateDevTask(devIdx, taskField, tIdx, e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button type="button" onClick={() => removeDevTask(devIdx, taskField, tIdx)}
              className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDailyStandupEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Updates</h3>
        <button type="button" onClick={addDeveloper}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> Add Developer
        </button>
      </div>

      {(editedContent?.team_updates || getTeamUpdates()).map((dev: any, dIdx: number) => (
        <div key={dIdx} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
          {/* Developer name & role */}
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Developer name"
              value={dev.name || ''}
              onChange={(e) => updateDevField(dIdx, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium"
            />
            <input type="text" placeholder="Role (e.g. Backend Developer)"
              value={dev.role || ''}
              onChange={(e) => updateDevField(dIdx, 'role', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button type="button" onClick={() => removeDeveloper(dIdx)}
              className="text-red-600 hover:text-red-700 p-2">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {renderTaskListEditor(dIdx, 'yesterday_tasks', "Yesterday's Tasks", <CheckCircle className="w-3.5 h-3.5" />, 'text-green-700 dark:text-green-400')}
          {renderTaskListEditor(dIdx, 'today_tasks', "Today's Tasks", <Clock className="w-3.5 h-3.5" />, 'text-blue-700 dark:text-blue-400')}
          {renderTaskListEditor(dIdx, 'blockers', "Blockers & Issues", <AlertTriangle className="w-3.5 h-3.5" />, 'text-red-700 dark:text-red-400')}
        </div>
      ))}

      {/* Blockers Summary */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Blockers Summary</h3>
          <button type="button" onClick={addBlockerSummary}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Add Blocker
          </button>
        </div>
        {getBlockersSummary().map((bs: any, bsIdx: number) => (
          <div key={bsIdx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-3">
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Blocker title"
                value={bs.title || ''}
                onChange={(e) => updateBlockerSummary(bsIdx, 'title', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium"
              />
              <button type="button" onClick={() => removeBlockerSummary(bsIdx)}
                className="text-red-600 hover:text-red-700 p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <textarea placeholder="Description" value={bs.description || ''}
              onChange={(e) => updateBlockerSummary(bsIdx, 'description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm mb-2" rows={2}
            />
            <input type="text" placeholder="Reported by (comma-separated names)"
              value={Array.isArray(bs.reported_by) ? bs.reported_by.join(', ') : (bs.reported_by || '')}
              onChange={(e) => updateBlockerSummary(bsIdx, 'reported_by', e.target.value.split(',').map((n: string) => n.trim()).filter(Boolean))}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm mb-2"
            />
            <input type="text" placeholder="Impact on the project"
              value={bs.impact || ''}
              onChange={(e) => updateBlockerSummary(bsIdx, 'impact', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderSprintMeetingEditor = () => (
    <div className="space-y-6">
      {["sprint_goals", "progress_summary", "issues_risks"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {getArrayField(field).map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item || ''}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRetrospectiveEditor = () => (
    <div className="space-y-6">
      {["what_went_well", "what_didnt_go_well", "improvements", "action_points"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {getArrayField(field).map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item || ''}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBrainstormingEditor = () => (
    <div className="space-y-6">
      {/* Meeting Topic */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Meeting Topic
        </label>
        <input
          type="text"
          value={editedContent?.meeting_topic || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, meeting_topic: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Meeting Objective */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Meeting Objective
        </label>
        <textarea
          value={editedContent?.meeting_objective || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, meeting_objective: e.target.value }))}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Summary
        </label>
        <textarea
          value={editedContent?.summary || ""}
          onChange={(e) => setEditedContent((prev: any) => ({ ...prev, summary: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Array Fields */}
      {["participants", "top_ideas", "categories", "key_themes"].map((field) => (
        <div key={field}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {getArrayField(field).map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item || ''}
                  onChange={(e) => updateArrayField(field, index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Decisions Made - with decision and assignee fields */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Decisions Made
          </h3>
          <button
            type="button"
            onClick={() => setEditedContent((prev: any) => ({
              ...prev,
              decisions_made: [...(prev.decisions_made || []), { decision: '', assignee: '' }]
            }))}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Decision
          </button>
        </div>
        <div className="space-y-3">
          {getArrayField("decisions_made").map((item: any, index: number) => (
            <div key={index} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Decision"
                  value={typeof item === 'string' ? item : (item.decision || '')}
                  onChange={(e) => setEditedContent((prev: any) => {
                    const updated = [...prev.decisions_made];
                    updated[index] = typeof item === 'string' 
                      ? { decision: e.target.value, assignee: '' }
                      : { ...item, decision: e.target.value };
                    return { ...prev, decisions_made: updated };
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Assignee (optional)"
                  value={typeof item === 'string' ? '' : (item.assignee || '')}
                  onChange={(e) => setEditedContent((prev: any) => {
                    const updated = [...prev.decisions_made];
                    updated[index] = typeof item === 'string'
                      ? { decision: item, assignee: e.target.value }
                      : { ...item, assignee: e.target.value };
                    return { ...prev, decisions_made: updated };
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setEditedContent((prev: any) => ({
                  ...prev,
                  decisions_made: prev.decisions_made.filter((_: any, i: number) => i !== index)
                }))}
                className="text-red-600 hover:text-red-700 mt-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Generic template-based editor for dynamic keys
  const formatSectionTitle = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderTemplateSectionEditor = (key: string, value: any, displayTitle?: string) => {
    if (key === 'header_image' || key === 'footer_image' || key === '_sections_order') return null;
    const sectionTitle = displayTitle || formatSectionTitle(key);

    // String field — textarea
    if (typeof value === 'string') {
      return (
        <div key={key}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {sectionTitle}
          </h3>
          <textarea
            value={editedContent[key] || ''}
            onChange={(e) => setEditedContent((prev: any) => ({ ...prev, [key]: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      );
    }

    // Array of strings — editable list
    if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'string')) {
      return (
        <div key={key}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sectionTitle}
            </h3>
            <button
              type="button"
              onClick={() => addArrayItem(key)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {getArrayField(key).map((item: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayField(key, idx, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button type="button" onClick={() => removeArrayItem(key, idx)}
                  className="text-red-600 hover:text-red-700 p-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Array of objects — editable table rows
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const columns = Object.keys(value[0]);
      return (
        <div key={key}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sectionTitle}
            </h3>
            <button
              type="button"
              onClick={() => {
                const emptyRow: any = {};
                columns.forEach(c => { emptyRow[c] = ''; });
                setEditedContent((prev: any) => ({
                  ...prev,
                  [key]: [...(prev[key] || []), emptyRow]
                }));
              }}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      {formatSectionTitle(col)}
                    </th>
                  ))}
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(editedContent[key] || []).map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className="border-t border-gray-200 dark:border-gray-600">
                    {columns.map(col => (
                      <td key={col} className="px-2 py-1">
                        <input
                          type="text"
                          value={row[col] ?? ''}
                          onChange={(e) => {
                            setEditedContent((prev: any) => {
                              const updated = [...prev[key]];
                              updated[rowIdx] = { ...updated[rowIdx], [col]: e.target.value };
                              return { ...prev, [key]: updated };
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => {
                        setEditedContent((prev: any) => ({
                          ...prev,
                          [key]: prev[key].filter((_: any, i: number) => i !== rowIdx)
                        }));
                      }} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTemplateEditor = () => {
    const sectionsOrder = editedContent?._sections_order as Array<{ key: string; title: string; type: string; order: number }> | undefined;

    if (sectionsOrder && sectionsOrder.length > 0) {
      return (
        <div className="space-y-6">
          {sectionsOrder
            .sort((a, b) => a.order - b.order)
            .map(({ key, title }) => {
              const value = editedContent[key];
              if (value === undefined) return null;
              return renderTemplateSectionEditor(key, value, title);
            })}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {editedContent && Object.entries(editedContent)
          .filter(([key]) => key !== 'header_image' && key !== 'footer_image' && key !== '_sections_order')
          .map(([key, value]) => renderTemplateSectionEditor(key, value))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !report || !editedContent) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error || "Failed to load report"}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Edit {report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Report
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version {report.version} • Make changes and save to create version {report.version + 1}
          </p>
        </div>

        {/* Editor Form */}
        <div className="p-8">
          {/* Header & Footer Images */}
          {renderImageUploadSection()}
          
          {report.template_id ? (
            renderTemplateEditor()
          ) : (
            <>
              {report.report_type === "daily_standup" && renderDailyStandupEditor()}
              {report.report_type === "sprint_meeting" && renderSprintMeetingEditor()}
              {report.report_type === "retrospective" && renderRetrospectiveEditor()}
              {report.report_type === "brainstorming" && renderBrainstormingEditor()}
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
