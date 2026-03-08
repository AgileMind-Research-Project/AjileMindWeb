import React, { useState, useEffect } from 'react';
import { releaseNotesApi, ReleaseNote, CreateReleaseNoteRequest, ReleaseNoteContent, BacklogRelease } from '@/lib/api/release-notes.api';
import { projectsApi } from '@/lib/api/projects.api';
import { toast } from 'sonner';

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

    // Individual field states for content arrays
    const [newFeature, setNewFeature] = useState('');
    const [newBugFix, setNewBugFix] = useState('');
    const [newImprovement, setNewImprovement] = useState('');

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

    const handleGenerateAI = async () => {
        if (!formData.project_id || !formData.version) {
            toast.error('Please select a project and enter a version');
            return;
        }

        setLoading(true);
        try {
            const response = await releaseNotesApi.generateAI({
                project_id: formData.project_id,
                version: formData.version,
                include_tasks: true
            });

            // Populate form with AI-generated content
            setFormData(prev => ({
                ...prev,
                content: response.content,
                summary: response.summary
            }));

            toast.success('Release note content generated!');
        } catch (error) {
            toast.error('Failed to generate content');
        } finally {
            setLoading(false);
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

    const handleConvertFromBacklog = (item: BacklogRelease) => {
        setFormData({
            project_id: item.project_id,
            version: item.id.includes('-') ? item.id : '1.0.0', // Default if not a Jira key
            title: item.summary,
            release_date: item.end_date ? item.end_date.split(' ')[0] : null,
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
            summary: item.description || ''
        });
        setShowModal(true);
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
    };

    const addItem = (type: keyof ReleaseNoteContent, value: string) => {
        if (!value.trim()) return;

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [type]: [...prev.content[type], value.trim()]
            }
        }));

        // Reset input
        if (type === 'features') setNewFeature('');
        if (type === 'bug_fixes') setNewBugFix('');
        if (type === 'improvements') setNewImprovement('');
    };

    const removeItem = (type: keyof ReleaseNoteContent, index: number) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [type]: prev.content[type].filter((_, i) => i !== index)
            }
        }));
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
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                >
                    + Create New Release
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
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
            </div>

            {/* Backlog Planning Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-sm">📅</span>
                        Planned Releases (Backlog)
                        <span className="text-sm text-gray-400 ml-2">({backlogReleases.length})</span>
                    </h2>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                                        <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No planned releases found in backlog.</td>
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
                                                        className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap"
                                                    >
                                                        PROCESS
                                                    </button>
                                                    <button
                                                        onClick={() => handleConvertFromBacklog(item)}
                                                        className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded hover:bg-gray-200 transition-all whitespace-nowrap"
                                                    >
                                                        CREATE DRAFT
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
                                            <div className="flex justify-end gap-2 text-xs">
                                                {note.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handlePublish(note.id)}
                                                        className="text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        PUBLISH
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(note.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    DELETE
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
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-20">
                            <h2 className="text-xl font-bold text-gray-900">Create Release Note</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Form fields... */}
                            {/* Project & Version */}
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Version *</label>
                                    <input
                                        type="text"
                                        placeholder="1.0.0"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Title & Type */}
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
                            {/* AI Generate Button */}
                            <button
                                onClick={handleGenerateAI}
                                disabled={loading || !formData.project_id || !formData.version}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 font-medium"
                            >
                                ✨ Generate with AI
                            </button>
                            {/* Content sections (Features, Bug Fixes, etc.) */}
                            <div className="space-y-4">
                                {/* Features */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Features</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Add a new feature"
                                            value={newFeature}
                                            onChange={(e) => setNewFeature(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addItem('features', newFeature)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <button onClick={() => addItem('features', newFeature)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add</button>
                                    </div>
                                    <ul className="space-y-1">
                                        {formData.content.features.map((item, i) => (
                                            <li key={i} className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded text-sm">
                                                <span>{item}</span>
                                                <button onClick={() => removeItem('features', i)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {/* Summary */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Summary</label>
                                <textarea
                                    placeholder="Brief overview of this release..."
                                    value={formData.summary || ''}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 z-10">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cancel</button>
                            <button onClick={handleCreate} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Draft'}</button>
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
        </div>
    );
};

export default ReleaseNotes;
