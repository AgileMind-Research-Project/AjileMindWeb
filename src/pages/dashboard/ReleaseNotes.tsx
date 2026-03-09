import React, { useState, useEffect, useRef } from 'react';
import { releaseNotesApi, ReleaseNote, CreateReleaseNoteRequest, ReleaseNoteContent, BacklogRelease } from '@/lib/api/release-notes.api';
import { projectsApi } from '@/lib/api/projects.api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Download,
    X,
    FileText,
    Sparkles,
    Zap,
    ShieldAlert,
    Bug,
    Calendar,
    Layers,
    CheckCircle2,
    Clock,
    User,
    ArrowRight
} from 'lucide-react';

const ReleaseNotes: React.FC = () => {
    const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [backlogReleases, setBacklogReleases] = useState<BacklogRelease[]>([]);
    const [selectedBacklogItem, setSelectedBacklogItem] = useState<BacklogRelease | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSprintBacklogModal, setShowSprintBacklogModal] = useState(false);
    const [sprintBacklogItems, setSprintBacklogItems] = useState<any[]>([]);
    const [selectedSprint, setSelectedSprint] = useState<{ project_id: number, sprint_id: number | null } | null>(null);
    const [showOfficialNoteModal, setShowOfficialNoteModal] = useState(false);
    const [selectedOfficialNote, setSelectedOfficialNote] = useState<ReleaseNote | null>(null);
    const pdfContentRef = useRef<HTMLDivElement>(null);

    // Form state
    const [formData, setFormData] = useState<CreateReleaseNoteRequest>({
        project_id: 0,
        version: '',
        title: '',
        release_date: null,
        release_type: 'MINOR',
        start_sprint: null,
        end_sprint: null,
        content: {
            features: [],
            bug_fixes: [],
            improvements: [],
            breaking_changes: [],
            known_issues: []
        },
        summary: ''
    });

    // AI generation state
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
    const [lastVersion, setLastVersion] = useState<string | null>(null);

    useEffect(() => {
        if (formData.project_id) {
            fetchLatestVersion(formData.project_id);
        } else {
            setLastVersion(null);
        }
    }, [formData.project_id]);

    const fetchLatestVersion = async (projectId: number) => {
        try {
            const { version } = await releaseNotesApi.getLatestVersion(projectId);
            setLastVersion(version);
            if (version) {
                setFormData(prev => ({ ...prev, version }));
            }
        } catch (error) {
            console.error('Failed to fetch latest version:', error);
            setLastVersion(null);
        }
    };

    useEffect(() => {
        loadProjects();
        loadReleaseNotes();
        loadBacklogReleases();
    }, [selectedProject, statusFilter]);

    const loadProjects = async () => {
        try {
            const response = await projectsApi.listProjects();
            setProjects(response.data || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    };

    const loadReleaseNotes = async () => {
        setLoading(true);
        try {
            const response = await releaseNotesApi.list({
                project_id: selectedProject || undefined,
                status: statusFilter || undefined
            });
            setReleaseNotes(response.items || []);
        } catch (error) {
            toast.error('Failed to load release notes');
        } finally {
            setLoading(false);
        }
    };

    const loadBacklogReleases = async () => {
        try {
            const response = selectedProject
                ? await releaseNotesApi.listBacklogReleases(selectedProject)
                : await releaseNotesApi.listAllBacklogReleases();
            setBacklogReleases(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Failed to load backlog releases:', error);
        }
    };

    const handleCreate = async () => {
        if (!formData.project_id || !formData.version || !formData.title) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await releaseNotesApi.create(formData);
            toast.success('Release note created successfully');
            setShowModal(false);
            resetForm();
            loadReleaseNotes();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create release note');
        } finally {
            setLoading(false);
        }
    };

    const generateAIContent = async (targetFormData: typeof formData) => {
        if (!targetFormData.project_id || (!targetFormData.start_sprint && !targetFormData.end_sprint)) {
            toast.error('Please select a project and sprint range');
            return;
        }

        setIsGeneratingAI(true);
        toast.info('🤖 AI analyzing completed sprint items...');

        try {
            const response = await releaseNotesApi.generateAI({
                project_id: targetFormData.project_id,
                include_tasks: true,
                start_sprint: targetFormData.start_sprint,
                end_sprint: targetFormData.end_sprint
            });

            // Populate form with AI-generated content from completed items
            setFormData(prev => ({
                ...prev,
                content: response.content,
                summary: response.summary,
                release_type: response.release_type || prev.release_type,
                version: response.suggested_version || prev.version
            }));
            setHasGeneratedContent(true);

            // Show success message with content summary
            const totalItems = (response.content.features?.length || 0) +
                (response.content.bug_fixes?.length || 0) +
                (response.content.improvements?.length || 0);
            toast.success(`✨ Generated from completed sprint items: ${response.content.features?.length || 0} features, ${response.content.bug_fixes?.length || 0} fixes, ${response.content.improvements?.length || 0} improvements!`);
        } catch (error) {
            console.error('AI generation error:', error);
            toast.error('Failed to generate content from sprint items. Please check if sprint has completed work.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleShowSprintBacklog = async (projectId: number, sprintId: number | null) => {
        setSelectedSprint({ project_id: projectId, sprint_id: sprintId });
        setShowSprintBacklogModal(true);

        try {
            // Get token from auth-storage (consistent with other components)
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.accessToken;
            if (!token) {
                console.error('No access token found');
                setSprintBacklogItems([]);
                return;
            }

            // Fetch all backlog items for this sprint and project (only completed items)
            const sprintParam = sprintId ? `?sprint_id=${sprintId}&status=done` : '?status=done';
            const response = await fetch(`http://localhost:8000/api/v1/backlog/project/${projectId}${sprintParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSprintBacklogItems(Array.isArray(data.data) ? data.data : data.items || []);
            } else {
                console.error('Failed to fetch sprint backlog', response.status, response.statusText);
                if (response.status === 401) {
                    console.error('Authentication failed - please log in again');
                }
                setSprintBacklogItems([]);
            }
        } catch (error) {
            console.error('Error fetching sprint backlog:', error);
            setSprintBacklogItems([]);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this release note?')) return;

        try {
            await releaseNotesApi.delete(id);
            toast.success('Release note deleted');
            loadReleaseNotes();
        } catch (error) {
            toast.error('Failed to delete release note');
        }
    };

    const handlePublish = async (id: number) => {
        if (!confirm('Publish this release note? It will be visible to all users.')) return;

        try {
            await releaseNotesApi.publish(id);
            toast.success('Release note published!');
            loadReleaseNotes();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to publish');
        }
    };

    const handleConvertFromBacklog = async (item: BacklogRelease) => {
        // Pre-fill form data from backlog item
        const initialFormData = {
            project_id: item.project_id,
            version: item.id.includes('-') ? item.id.split('-')[1] || '1.0.0' : '1.0.0',
            title: `Release for ${item.summary}`,
            release_date: item.end_date ? item.end_date.split(' ')[0] : null,
            release_type: 'MINOR' as const,
            start_sprint: item.sprint_id,
            end_sprint: item.sprint_id,
            content: {
                features: [],
                bug_fixes: [],
                improvements: [],
                breaking_changes: [],
                known_issues: []
            },
            summary: item.description || ''
        };

        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleViewOfficialNote = (note: ReleaseNote) => {
        setSelectedOfficialNote(note);
        setShowOfficialNoteModal(true);
    };

    const downloadAsPDF = async () => {
        if (!pdfContentRef.current || !selectedOfficialNote) return;

        const canvas = await html2canvas(pdfContentRef.current, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${selectedOfficialNote.title.replace(/\s+/g, '_')}_v${selectedOfficialNote.version}.pdf`);
        toast.success('PDF Downloaded successfully');
    };

    const resetForm = () => {
        setFormData({
            project_id: 0,
            version: '',
            title: '',
            release_date: null,
            release_type: 'MINOR',
            start_sprint: null,
            end_sprint: null,
            content: {
                features: [],
                bug_fixes: [],
                improvements: [],
                breaking_changes: [],
                known_issues: []
            },
            summary: ''
        });
        setHasGeneratedContent(false);
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-lg font-medium text-gray-900 mb-1">
                        Release Notes
                    </h1>
                    <p className="text-sm text-gray-600">Manage release notes and backlog releases.</p>
                </div>
            </div>

            {/* Premium Controls Row */}
            <div className="bg-white/50 backdrop-blur-md rounded-lg shadow-sm border border-gray-100 p-3 mb-4 flex flex-col md:flex-row gap-3 sticky top-6 z-10">
                <div className="flex-1 flex gap-2">
                    <select
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm"
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                    </select>
                </div>
            </div>

            {/* Planned Releases (Backlog) Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-sm">📅</span>
                        Planned Releases (Backlog)
                        <span className="text-sm text-gray-400 ml-2">({backlogReleases.length})</span>
                    </h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left border-b border-gray-200">
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Project</th>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Key</th>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase text-center">Sprint</th>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Summary</th>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Target Date</th>
                                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {backlogReleases.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">No planned releases found in backlog.</td>
                                    </tr>
                                ) : (
                                    backlogReleases.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-2">
                                                <span className="text-xs text-gray-600">
                                                    {projects.find(p => p.project_id === item.project_id)?.project_name || `Project ${item.project_id}`}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                    {item.id}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className="text-xs font-bold text-gray-600">
                                                    {item.sprint_id ? `S${item.sprint_id}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-sm text-gray-900">{item.summary}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description || 'No description'}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-xs text-gray-600">
                                                    {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'TBD'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleShowSprintBacklog(item.project_id, item.sprint_id)}
                                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-all whitespace-nowrap font-medium"
                                                        title="View all backlog items for this sprint"
                                                    >
                                                        📋 backlog
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBacklogItem(item);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        👁️
                                                    </button>
                                                    <button
                                                        onClick={() => handleConvertFromBacklog(item)}
                                                        className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded hover:from-purple-700 hover:to-blue-700 transition-all whitespace-nowrap font-medium"
                                                    >
                                                        PROCESS
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Official Release Notes Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center text-sm">📄</span>
                        Official Release Notes
                        <span className="text-sm text-gray-400 ml-2">({releaseNotes.length})</span>
                    </h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Release Info</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">Loading...</td></tr>
                            ) : releaseNotes.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No official release notes found.</td></tr>
                            ) : (
                                releaseNotes.map(note => (
                                    <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded font-mono text-sm border border-indigo-200">
                                                v{note.version}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-sm text-gray-900">{note.title}</div>
                                            <div className="text-xs text-gray-500">{projects.find(p => p.project_id === note.project_id)?.project_name || 'Project ' + note.project_id}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-1.5 py-0.5 rounded text-xs ${note.release_type === 'MAJOR' ? 'bg-red-100 text-red-700' :
                                                note.release_type === 'MINOR' ? 'bg-blue-100 text-blue-700' :
                                                    note.release_type === 'PATCH' ? 'bg-green-100 text-green-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {note.release_type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-sm text-gray-600 flex items-center gap-1">
                                                {(note as any).start_sprint ? (
                                                    <>
                                                        <span className="text-indigo-600">S{(note as any).start_sprint}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-indigo-600">S{(note as any).end_sprint || (note as any).start_sprint}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">{note.release_date || new Date(note.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${note.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                                note.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${note.status === 'PUBLISHED' ? 'bg-green-500' : note.status === 'DRAFT' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                                                {note.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                <button
                                                    onClick={() => handleViewOfficialNote(note)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    👁️
                                                </button>
                                                {note.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handlePublish(note.id)}
                                                        className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all text-xs"
                                                    >
                                                        PUBLISH
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(note.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors text-lg"
                                                    title="Delete"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-20">
                            <h2 className="text-xl font-bold text-gray-900">Create Release Note</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Summary / Highlights First */}
                            <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <span>📝</span> Release Summary / Highlights
                                </label>
                                <textarea
                                    placeholder="Provide a brief overview or highlights of this release..."
                                    value={formData.summary || ''}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="w-full px-4 py-3 border border-amber-100 bg-white rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-gray-400"
                                    rows={4}
                                />
                                <p className="mt-2 text-[10px] text-gray-500 italic">This summary provides an executive overview for users and stakeholders.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Project *</label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value={0}>Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-semibold text-gray-700">Version *</label>
                                        {lastVersion && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, version: lastVersion })}
                                                className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-colors"
                                                title="Click to use this version as a base"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                Last: {lastVersion}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="1.2.0"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    placeholder="Major Update - New Features"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Release Type</label>
                                    <select
                                        value={formData.release_type}
                                        onChange={(e) => setFormData({ ...formData, release_type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="MAJOR">Major</option>
                                        <option value="MINOR">Minor</option>
                                        <option value="PATCH">Patch</option>
                                        <option value="HOTFIX">Hotfix</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Release Date</label>
                                    <input
                                        type="date"
                                        value={formData.release_date || ''}
                                        onChange={(e) => setFormData({ ...formData, release_date: e.target.value || null })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Sprint</label>
                                    <input
                                        type="number"
                                        placeholder="Sprint ID"
                                        value={formData.start_sprint || ''}
                                        onChange={(e) => setFormData({ ...formData, start_sprint: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Sprint</label>
                                    <input
                                        type="number"
                                        placeholder="Sprint ID"
                                        value={formData.end_sprint || ''}
                                        onChange={(e) => setFormData({ ...formData, end_sprint: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* AI Generation Section */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">🤖 AI-Generated Content</h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        Generate release notes from completed sprint items automatically
                                    </p>

                                    {!hasGeneratedContent ? (
                                        <button
                                            onClick={() => generateAIContent(formData)}
                                            disabled={isGeneratingAI || !formData.project_id}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                        >
                                            {isGeneratingAI ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Analyzing Sprint Items...
                                                </span>
                                            ) : (
                                                '✨ Generate from Completed Sprint Items'
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => generateAIContent(formData)}
                                            disabled={isGeneratingAI}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                                        >
                                            🔄 Regenerate Content
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Generated Content Display */}
                            {hasGeneratedContent && (
                                <div className="space-y-6">
                                    {/* New Features */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">✨ New Features</label>
                                        {formData.content.features.length > 0 ? (
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <ul className="space-y-2">
                                                    {formData.content.features.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-blue-800">
                                                            <span className="text-blue-500 mt-0.5">•</span>
                                                            <span className="text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                                No new features found in completed sprint items
                                            </div>
                                        )}
                                    </div>

                                    {/* Bug Fixes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">🐛 Bug Fixes</label>
                                        {formData.content.bug_fixes.length > 0 ? (
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <ul className="space-y-2">
                                                    {formData.content.bug_fixes.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-green-800">
                                                            <span className="text-green-500 mt-0.5">•</span>
                                                            <span className="text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                                No bug fixes found in completed sprint items
                                            </div>
                                        )}
                                    </div>

                                    {/* Improvements */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Improvements</label>
                                        {formData.content.improvements.length > 0 ? (
                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <ul className="space-y-2">
                                                    {formData.content.improvements.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-purple-800">
                                                            <span className="text-purple-500 mt-0.5">•</span>
                                                            <span className="text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                                No improvements found in completed sprint items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 z-10">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cancel</button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !hasGeneratedContent}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!hasGeneratedContent ? 'Generate AI content first' : ''}
                            >
                                {loading ? 'Creating...' : 'Create Release Note'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backlog Item Details Modal */}
            {showDetailsModal && selectedBacklogItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">DETAILS</span>
                                {selectedBacklogItem.id}: {selectedBacklogItem.summary}
                            </h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-white/80 hover:text-white text-xl">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {projects.find(p => p.project_id === selectedBacklogItem.project_id)?.project_name || `Project ${selectedBacklogItem.project_id}`}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sprint</p>
                                    <p className="text-sm font-medium text-indigo-600">S{selectedBacklogItem.sprint_id || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Date</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {selectedBacklogItem.end_date ? new Date(selectedBacklogItem.end_date).toLocaleDateString() : 'TBD'}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedBacklogItem.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {selectedBacklogItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {selectedBacklogItem.description || "No detailed description provided for this release item."}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                            <button
                                onClick={() => {
                                    handleConvertFromBacklog(selectedBacklogItem);
                                    setShowDetailsModal(false);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                                START PROCESS
                            </button>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sprint Backlog Modal */}
            {showSprintBacklogModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Completed Sprint Items</h3>
                                <p className="text-gray-600 text-sm">
                                    Project: {selectedSprint?.project_id} | Sprint: {selectedSprint?.sprint_id || 'General'} | Status: Done
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSprintBacklogModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {sprintBacklogItems.length > 0 ? (
                            <div className="space-y-3">
                                {sprintBacklogItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-gray-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 mb-2">
                                                    {item.summary || item.title || item.task_name || `Backlog Item #${index + 1}`}
                                                </h4>
                                                <p className="text-gray-600 text-sm mb-2">
                                                    {item.description || item.task_description || 'No description available'}
                                                </p>
                                                <div className="flex gap-4 text-xs text-gray-500">
                                                    <span>Type: {item.issue_type || item.type || item.task_type || 'Unknown'}</span>
                                                    <span>Priority: {item.priority || 'Medium'}</span>
                                                    {item.status && <span>Status: {item.status}</span>}
                                                    {(item.jira_issue_key || item.issue_key) && (
                                                        <span className="text-blue-600">Key: {item.jira_issue_key || item.issue_key}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex gap-2">
                                                {item.id && (
                                                    <button
                                                        onClick={() => {
                                                            console.log('Converting item to release note:', item);
                                                            // You can add conversion logic here if needed
                                                        }}
                                                        className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition-colors"
                                                        title="Convert to Release Note"
                                                    >
                                                        Convert
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-4xl mb-4">✅</div>
                                <p className="text-gray-600">No completed backlog items found for this sprint</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowSprintBacklogModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Official Release Note Modal - Re-designed for Professional Look */}
            {showOfficialNoteModal && selectedOfficialNote && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
                        {/* Elegant Minimal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-none">Release Documentation</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <ShieldAlert size={10} className="text-indigo-400" /> Authorized Copy
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v{selectedOfficialNote.version}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={downloadAsPDF}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 group"
                                >
                                    <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                                    EXPORT AS PDF
                                </button>
                                <button
                                    onClick={() => setShowOfficialNoteModal(false)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Professional Document Body */}
                        <div className="flex-1 overflow-y-auto p-0" style={{ backgroundColor: 'rgba(241, 245, 249, 0.3)' }}>
                            <div className="max-w-4xl mx-auto my-10 bg-white shadow-xl border border-slate-100 rounded-sm" ref={pdfContentRef} style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                                {/* Document Header Panel */}
                                <div className="p-12 border-b" style={{ borderBottomColor: '#f1f5f9' }}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                                        <div className="flex-1">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase mb-6 border" style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: 'rgba(199, 210, 254, 0.5)' }}>
                                                <Zap size={10} /> Official Release
                                            </div>
                                            <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4" style={{ color: '#0f172a' }}>
                                                {selectedOfficialNote.title}
                                            </h1>
                                            {selectedOfficialNote.summary && (
                                                <p className="text-lg leading-relaxed max-w-2xl font-medium" style={{ color: '#64748b' }}>
                                                    {selectedOfficialNote.summary}
                                                </p>
                                            )}
                                        </div>

                                        {/* Metadata Card */}
                                        <div className="w-full md:w-64 rounded-2xl p-6 border shrink-0" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#94a3b8' }}>Project</span>
                                                    <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f172a' }}>
                                                        <Layers size={14} style={{ color: '#6366f1' }} />
                                                        {projects.find(p => p.project_id === selectedOfficialNote.project_id)?.project_name || 'Project ' + selectedOfficialNote.project_id}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#94a3b8' }}>Version</span>
                                                        <span className="text-lg font-black block" style={{ color: '#4f46e5' }}>v{selectedOfficialNote.version}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#94a3b8' }}>Type</span>
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border" style={
                                                            selectedOfficialNote.release_type === 'MAJOR' ? { backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fee2e2' } :
                                                                selectedOfficialNote.release_type === 'MINOR' ? { backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#e0e7ff' } :
                                                                    { backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#d1fae5' }
                                                        }>
                                                            {selectedOfficialNote.release_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#94a3b8' }}>Release Date</span>
                                                    <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f172a' }}>
                                                        <Calendar size={14} style={{ color: '#6366f1' }} />
                                                        {selectedOfficialNote.release_date || new Date(selectedOfficialNote.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Statistics Bar - Professional style */}
                                    <div className="grid grid-cols-4 gap-4 py-8 border-y" style={{ borderTopColor: '#f8fafc', borderBottomColor: '#f8fafc' }}>
                                        {[
                                            { label: 'Features', value: selectedOfficialNote.content.features?.length || 0, color: '#4f46e5', bg: '#eef2ff', icon: Sparkles },
                                            { label: 'Fixes', value: selectedOfficialNote.content.bug_fixes?.length || 0, color: '#d97706', bg: '#fffbeb', icon: Bug },
                                            { label: 'Optimized', value: selectedOfficialNote.content.improvements?.length || 0, color: '#059669', bg: '#ecfdf5', icon: Zap },
                                            { label: 'Breaking', value: selectedOfficialNote.content.breaking_changes?.length || 0, color: '#e11d48', bg: '#fff1f2', icon: ShieldAlert },
                                        ].map((stat, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                                    <stat.icon size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black leading-none" style={{ color: '#0f172a' }}>{stat.value}</div>
                                                    <div className="text-[10px] font-bold uppercase mt-0.5" style={{ color: '#94a3b8' }}>{stat.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Detailed Content */}
                                <div className="p-12 space-y-16">
                                    {/* Features Section */}
                                    {selectedOfficialNote.content.features?.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-4 mb-8">
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3" style={{ color: '#0f172a' }}>
                                                    <span className="w-10 h-0.5" style={{ backgroundColor: '#4f46e5' }}></span>
                                                    Principal Features
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {selectedOfficialNote.content.features.map((item, idx) => (
                                                    <div key={idx} className="group p-5 rounded-2xl bg-white border hover:shadow-md transition-all flex items-start gap-4" style={{ borderColor: '#f1f5f9' }}>
                                                        <div className="mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                                                            {idx + 1}
                                                        </div>
                                                        <p className="font-medium leading-relaxed" style={{ color: '#334155' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Improvements & Optimizations Section */}
                                    {selectedOfficialNote.content.improvements?.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-4 mb-8">
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3" style={{ color: '#0f172a' }}>
                                                    <span className="w-10 h-0.5" style={{ backgroundColor: '#10b981' }}></span>
                                                    System Optimizations
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedOfficialNote.content.improvements.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-[#f8fafc]">
                                                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                                                        <p className="font-medium leading-relaxed" style={{ color: '#475569' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Maintenance & Bug Fixes Section */}
                                    {selectedOfficialNote.content.bug_fixes?.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-4 mb-8">
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3" style={{ color: '#0f172a' }}>
                                                    <span className="w-10 h-0.5" style={{ backgroundColor: '#f59e0b' }}></span>
                                                    Security & Maintenance
                                                </h3>
                                            </div>
                                            <div className="rounded-3xl p-8 border" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)', borderColor: '#f1f5f9' }}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    {selectedOfficialNote.content.bug_fixes.map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-3">
                                                            <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#fbbf24' }}></div>
                                                            <p className="text-sm font-medium leading-relaxed" style={{ color: '#475569' }}>{item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Essential Notifications / Breaking Changes */}
                                    {selectedOfficialNote.content.breaking_changes?.length > 0 && (
                                        <section className="rounded-3xl p-8 border" style={{ backgroundColor: 'rgba(255, 241, 242, 0.5)', borderColor: 'rgba(255, 228, 230, 0.5)' }}>
                                            <div className="flex items-center gap-3 mb-6" style={{ color: '#be123c' }}>
                                                <ShieldAlert size={20} />
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Mandatory Transitions</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {selectedOfficialNote.content.breaking_changes.map((item, idx) => (
                                                    <div key={idx} className="p-5 rounded-2xl border shadow-sm flex items-start gap-4" style={{ backgroundColor: '#ffffff', borderColor: '#ffe4e6' }}>
                                                        <ArrowRight size={18} className="mt-0.5 shrink-0" style={{ color: '#e11d48' }} />
                                                        <p className="font-bold leading-relaxed" style={{ color: '#4c0519' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Footer & Compliance Branding */}
                                <div className="p-12 border-t flex flex-col md:flex-row justify-between items-center gap-8" style={{ backgroundColor: 'rgba(248, 250, 252, 0.2)', borderTopColor: '#f1f5f9' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: '#0f172a' }}>A</div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#cbd5e1' }}>Automated Documentation</div>
                                            <div className="text-sm font-bold" style={{ color: '#0f172a' }}>AgileMind Enterprise Intelligence</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none" style={{ color: '#cbd5e1' }}>Authentication Token</div>
                                        <div className="font-mono text-[9px] px-3 py-1.5 rounded-lg border" style={{ color: '#94a3b8', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                            {btoa(`RN-${selectedOfficialNote.id}-${selectedOfficialNote.version}-${selectedOfficialNote.created_at}`).substring(0, 32).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contextual Action Hint */}
                            <div className="max-w-4xl mx-auto px-12 py-12 text-center">
                                <p className="text-xs font-medium flex items-center justify-center gap-2" style={{ color: '#94a3b8' }}>
                                    <Clock size={12} /> This document is generated based on verified sprint completion logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReleaseNotes;
