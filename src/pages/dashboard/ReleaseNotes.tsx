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
    ArrowRight,
    LifeBuoy
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
            // If there's a previous version, pre-fill it (user can increment it)
            // If no previous version, set initial version to '1.0.0'
            setFormData(prev => ({
                ...prev,
                version: version || '1.0.0'
            }));
        } catch (error) {
            console.error('Failed to fetch latest version:', error);
            setLastVersion(null);
            setFormData(prev => ({ ...prev, version: '1.0.0' }));
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

        const toastId = toast.loading('Preparing professional A4 release notes...');

        try {
            const canvas = await html2canvas(pdfContentRef.current, {
                scale: 2, // Standard high-quality scale
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        const computedStyle = window.getComputedStyle(el);

                        // Sanitization for modern color spaces
                        if (computedStyle.color && (computedStyle.color.includes('oklch') || computedStyle.color.includes('oklab'))) {
                            el.style.color = '#0f172a';
                        }
                        if (computedStyle.backgroundColor && (computedStyle.backgroundColor.includes('oklch') || computedStyle.backgroundColor.includes('oklab'))) {
                            el.style.backgroundColor = 'transparent';
                        }
                        if (computedStyle.borderColor && (computedStyle.borderColor.includes('oklch') || computedStyle.borderColor.includes('oklab'))) {
                            el.style.borderColor = '#e2e8f0';
                        }
                        if (computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none') {
                            el.style.backdropFilter = 'none';
                        }
                        el.style.fontFeatureSettings = 'normal';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Page 1
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Page 2 and beyond
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const projectName = projects.find(p => p.project_id === selectedOfficialNote.project_id)?.project_name || 'Project';
            const safeFileName = `${projectName}_v${selectedOfficialNote.version}_ReleaseNote`.replace(/[^a-z0-9]/gi, '_');
            pdf.save(`${safeFileName}.pdf`);
            toast.dismiss(toastId);
            toast.success('Professional A4 PDF format generated');
        } catch (error) {
            console.error('PDF Export failed:', error);
            toast.dismiss(toastId);
            toast.error('Could not generate A4 PDF format');
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                <div>
                    <h1 className="text-lg font-medium text-gray-900 mb-1">
                        Release Notes
                    </h1>
                    <p className="text-sm text-gray-600">Manage release notes and backlog releases.</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="mt-3 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                >
                    <span className="text-lg">+</span> Create Official Note
                </button>
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
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500">Project</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500">Key</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500 text-center">Sprint</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500">Summary</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500">Target Date</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500">Status</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-500">Action</th>
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
                                                        Process
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
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Version</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Release Info</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Coverage</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Status</th>
                                <th className="px-3 py-2 text-right text-xs font-bold text-gray-500">Actions</th>
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
                                                        Publish
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
                                        placeholder="1.0.0"
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
                                    <p className="text-[10px] font-bold text-gray-400">Project</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {projects.find(p => p.project_id === selectedBacklogItem.project_id)?.project_name || `Project ${selectedBacklogItem.project_id}`}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-bold text-gray-400">Sprint</p>
                                    <p className="text-sm font-medium text-indigo-600">S{selectedBacklogItem.sprint_id || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400">Target Date</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {selectedBacklogItem.end_date ? new Date(selectedBacklogItem.end_date).toLocaleDateString() : 'TBD'}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-bold text-gray-400">Status</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedBacklogItem.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {selectedBacklogItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 mb-2">Description</p>
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
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setShowSprintBacklogModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto w-full shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
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

            {/* Professional Enterprise Documentation Modal */}
            {showOfficialNoteModal && selectedOfficialNote && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xl transition-all duration-500">
                    <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-[#1e293b] animate-in fade-in zoom-in duration-300">
                        {/* Clinical Enterprise Header */}
                        <div className="px-10 py-6 border-b border-[#f1f5f9] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-[#0f172a] text-white rounded-lg flex items-center justify-center shadow-lg transform -rotate-1">
                                    <FileText size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#0f172a] tracking-tight leading-none">External Release Report</h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#64748b] tracking-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div> Active Production
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-[#cbd5e1]"></span>
                                        <span className="text-[10px] font-semibold text-[#64748b] tracking-tight">Reference ID: AM-{selectedOfficialNote.id.toString().padStart(5, '0')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={downloadAsPDF}
                                    className="flex items-center gap-2.5 px-6 py-2.5 bg-[#0f172a] text-white text-[11px] font-bold rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group tracking-tight"
                                >
                                    <Download size={15} />
                                    Generate PDF
                                </button>
                                <button
                                    onClick={() => setShowOfficialNoteModal(false)}
                                    className="w-10 h-10 flex items-center justify-center text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-full transition-all"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Professional Document Body */}
                        <div className="flex-1 overflow-y-auto p-0 bg-[#f8fafc]">
                            <div className="max-w-[850px] mx-auto my-8 bg-[#ffffff] border border-[#e2e8f0] rounded-sm overflow-hidden" ref={pdfContentRef} style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
                                {/* Corporate Letterhead / Header */}
                                <div className="p-10 pb-0">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="w-6 h-0.5 bg-[#1e293b]"></div>
                                                <span className="text-[10px] font-bold text-[#1e293b] tracking-tight">RELEASE DOCUMENTATION</span>
                                            </div>
                                            <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-5">
                                                {selectedOfficialNote.title}
                                            </h1>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#e2e8f0] rounded-lg overflow-hidden bg-[#f8fafc]">
                                                <div className="flex flex-col gap-1 p-5 border-r border-[#e2e8f0]">
                                                    <span className="text-[10px] font-bold text-[#64748b]">Product Name</span>
                                                    <span className="text-sm font-bold text-[#0f172a]">
                                                        {projects.find(p => p.project_id === selectedOfficialNote.project_id)?.project_name || 'AgileMind Project'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-5 border-r border-[#e2e8f0]">
                                                    <span className="text-[10px] font-bold text-[#64748b]">Version</span>
                                                    <span className="text-sm font-bold text-[#0f172a]">v{selectedOfficialNote.version}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-5 border-r border-[#e2e8f0]">
                                                    <span className="text-[10px] font-bold text-[#64748b]">Release Date</span>
                                                    <span className="text-sm font-bold text-[#0f172a]">
                                                        {selectedOfficialNote.release_date || new Date(selectedOfficialNote.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-5">
                                                    <span className="text-[10px] font-bold text-[#64748b]">Release Type</span>
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded inline-block w-fit border ${selectedOfficialNote.release_type === 'MAJOR' ? 'bg-[#fef2f2] text-[#991b1b] border-[#fee2e2]' :
                                                        selectedOfficialNote.release_type === 'MINOR' ? 'bg-[#eff6ff] text-[#1e40af] border-[#dbeafe]' :
                                                            'bg-[#f0fdf4] text-[#166534] border-[#dcfce7]'
                                                        }`}>
                                                        {selectedOfficialNote.release_type.charAt(0) + selectedOfficialNote.release_type.slice(1).toLowerCase()} Update
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modern Sidebar Metadata */}
                                        <div className="w-full md:w-[200px] shrink-0 border-l border-[#f1f5f9] pl-8 hidden md:block">
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#94a3b8] block mb-1.5">Project Entity</span>
                                                    <p className="text-sm font-bold text-[#0f172a] leading-tight">
                                                        {projects.find(p => p.project_id === selectedOfficialNote.project_id)?.project_name || 'Project Entity ' + selectedOfficialNote.project_id}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#94a3b8] block mb-1.5">Publication Date</span>
                                                    <p className="text-sm font-bold text-[#0f172a]">
                                                        {selectedOfficialNote.release_date || new Date(selectedOfficialNote.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#94a3b8] block mb-1.5">Authenticated By</span>
                                                    <p className="text-[11px] font-medium text-[#64748b] leading-tight">
                                                        AgileMind Intelligence Protocol
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedOfficialNote.summary && (
                                        <div className="mb-8">
                                            <span className="text-[10px] font-bold text-[#64748b] block mb-2">02. EXECUTIVE SUMMARY</span>
                                            <div className="relative">
                                                <div className="absolute top-0 left-0 w-0.5 h-full bg-[#1e293b]"></div>
                                                <p className="pl-6 text-lg font-medium text-[#475569] leading-6 max-w-2xl italic">
                                                    "{selectedOfficialNote.summary}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Deep Document Content */}
                                <div className="px-10 pb-12 space-y-8">
                                    {/* Features Section */}
                                    {selectedOfficialNote.content.features?.length > 0 && (
                                        <section>
                                            <div className="flex items-baseline justify-between mb-4 border-b border-[#f1f5f9] pb-1.5">
                                                <h3 className="text-[10px] font-bold text-[#64748b]">03. NEW FEATURES</h3>
                                                <span className="text-[10px] font-medium text-[#94a3b8]">{selectedOfficialNote.content.features.length} items</span>
                                            </div>
                                            <div className="space-y-6">
                                                {selectedOfficialNote.content.features.map((item, idx) => (
                                                    <div key={idx} className="flex gap-6 items-start group">
                                                        <span className="text-xs font-black text-[#cbd5e1] w-4 mt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                                                        <div className="space-y-1">
                                                            <p className="text-[15px] font-semibold text-[#0f172a] leading-relaxed">{item}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Operational Improvements */}
                                    {selectedOfficialNote.content.improvements?.length > 0 && (
                                        <section>
                                            <div className="flex items-baseline justify-between mb-4 border-b border-[#f1f5f9] pb-1.5">
                                                <h3 className="text-[10px] font-bold text-[#64748b]">04. ENHANCEMENTS / IMPROVEMENTS</h3>
                                                <span className="text-[10px] font-medium text-[#94a3b8]">{selectedOfficialNote.content.improvements.length} items</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-5">
                                                {selectedOfficialNote.content.improvements.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-5 p-5 bg-[#f8fafc] rounded border border-[#f1f5f9]">
                                                        <div className="w-5 h-5 bg-[#ffffff] border border-[#e2e8f0] rounded flex items-center justify-center text-[#10b981]" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                                            <CheckCircle2 size={12} strokeWidth={3} />
                                                        </div>
                                                        <p className="text-[14px] font-medium text-[#475569]">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Maintenance Logs (Bug Fixes) */}
                                    {selectedOfficialNote.content.bug_fixes?.length > 0 && (
                                        <section>
                                            <div className="flex items-baseline justify-between mb-4 border-b border-[#f1f5f9] pb-1.5">
                                                <h3 className="text-[10px] font-bold text-[#64748b]">05. FIXED BUGS</h3>
                                                <span className="text-[10px] font-medium text-[#94a3b8]">{selectedOfficialNote.content.bug_fixes.length} items</span>
                                            </div>
                                            <div className="columns-1 md:columns-2 gap-x-12 space-y-3">
                                                {selectedOfficialNote.content.bug_fixes.map((item, idx) => (
                                                    <div key={idx} className="break-inside-avoid flex items-start gap-4 p-4 hover:bg-[#fff7ed] transition-colors rounded">
                                                        <div className="mt-2 w-1 h-1 bg-[#f59e0b] rounded-full shrink-0"></div>
                                                        <p className="text-[13px] font-medium text-[#64748b] leading-relaxed">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Known Issues */}
                                    <section>
                                        <div className="flex items-baseline justify-between mb-4 border-b border-[#f1f5f9] pb-1.5">
                                            <h3 className="text-[10px] font-bold text-[#64748b]">06. KNOWN ISSUES</h3>
                                            <span className="text-[10px] font-medium text-[#94a3b8]">
                                                {selectedOfficialNote.content.known_issues?.length > 0 ? `${selectedOfficialNote.content.known_issues.length} items` : 'Ongoing works'}
                                            </span>
                                        </div>
                                        {selectedOfficialNote.content.known_issues?.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedOfficialNote.content.known_issues.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start p-4 hover:bg-[#f8fafc] transition-colors rounded border border-transparent hover:border-[#f1f5f9]">
                                                        <div className="mt-1.5 w-1.5 h-1.5 bg-[#94a3b8] rounded-full shrink-0"></div>
                                                        <p className="text-[14px] font-medium text-[#64748b] leading-relaxed">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 bg-[#f8fafc] border border-[#f1f5f9] border-dashed rounded-lg text-center">
                                                <p className="text-[14px] text-[#94a3b8] font-medium leading-relaxed italic">
                                                    No major known issues were reported for this release period.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    <section className="bg-[#f8fafc] border border-[#e2e8f0] rounded-sm p-8">
                                        <div className="flex items-center gap-4 mb-4 text-[#0f172a]">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#1e293b] border border-[#e2e8f0]">
                                                <LifeBuoy size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold text-[#64748b]">07. CALL TO ACTION / SUPPORT</h3>
                                                <p className="text-[10px] text-[#94a3b8] font-medium leading-none">Need help or discovered a bug?</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[14px] text-[#475569] leading-relaxed">
                                                If you encounter any issues or need further assistance with the new features, please contact our support team.
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                <a href="mailto:support@ajilemind.com" className="px-5 py-2 bg-[#0f172a] text-[#ffffff] text-[11px] font-bold rounded-md transition-all" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    Email Support
                                                </a>
                                                <a href="#" className="px-5 py-2 border border-[#e2e8f0] text-[#0f172a] text-[11px] font-bold rounded-md hover:bg-[#f8fafc] transition-all">
                                                    Documentation Portal
                                                </a>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Security Footer / Compliance Section */}
                                <div className="px-10 py-8 bg-[#0f172a] text-[#ffffff]">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 opacity-100">
                                                <div className="w-10 h-10 border-2 border-[#ffffff] flex items-center justify-center font-bold text-xl italic tracking-tighter" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>A</div>
                                                <div>
                                                    <p className="text-[11px] font-bold mb-0.5">AgileMind Enterprise</p>
                                                    <p className="text-[9px] font-medium text-[#94a3b8] opacity-80 leading-none">Intelligence Synthesis Group</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-[#94a3b8] font-medium leading-relaxed max-w-sm opacity-60">
                                                This document is electronically verified and authorized for public distribution. Any unauthorized modification of the synthesis content is strictly prohibited by AI security protocols.
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="mb-4 inline-block px-3 py-1 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-full text-[9px] font-bold tracking-tight">Official Synthesis</div>
                                            <div className="font-mono text-[9px] text-[#64748b] bg-[rgba(255,255,255,0.05)] px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded">
                                                {btoa(`RN-${selectedOfficialNote.id}-${selectedOfficialNote.version}-${selectedOfficialNote.created_at}`).substring(0, 8).toUpperCase()}-{selectedOfficialNote.version.replace(/\./g, '')}
                                            </div>
                                            <p className="text-[10px] font-bold mt-4 text-[#94a3b8]">Document Lifecycle 2026</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contextual Action Hint */}
                            <div className="max-w-4xl mx-auto px-12 py-16 text-center">
                                <p className="text-[#94a3b8] text-[11px] font-semibold tracking-tight flex items-center justify-center gap-3">
                                    <Clock size={14} strokeWidth={2.5} /> Verified by Project Intelligence Protocol
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ReleaseNotes;
