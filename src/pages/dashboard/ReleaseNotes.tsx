import React, { useState, useEffect } from 'react';
import { releaseNotesApi, ReleaseNote, CreateReleaseNoteRequest, ReleaseNoteContent } from '@/lib/api/release-notes.api';
import { projectsApi } from '@/lib/api/projects.api';
import { toast } from 'sonner';

const ReleaseNotes: React.FC = () => {
    const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState<CreateReleaseNoteRequest>({
        project_id: 0,
        version: '',
        title: '',
        release_date: null,
        release_type: 'MINOR',
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

    const resetForm = () => {
        setFormData({
            project_id: 0,
            version: '',
            title: '',
            release_date: null,
            release_type: 'MINOR',
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">📝 Release Notes</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Create Release Note
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4">
                <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* Release Notes List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : releaseNotes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No release notes found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Version</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {releaseNotes.map(note => (
                                <tr key={note.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm text-blue-600">{note.version}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{note.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {projects.find(p => p.project_id === note.project_id)?.project_name || note.project_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${note.release_type === 'MAJOR' ? 'bg-red-100 text-red-700' :
                                            note.release_type === 'MINOR' ? 'bg-blue-100 text-blue-700' :
                                                note.release_type === 'PATCH' ? 'bg-green-100 text-green-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {note.release_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${note.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                            note.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {note.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {note.release_date || new Date(note.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex gap-2">
                                            {note.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handlePublish(note.id)}
                                                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Create Release Note</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
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

                            {/* AI Generate Button */}
                            <button
                                onClick={handleGenerateAI}
                                disabled={loading || !formData.project_id || !formData.version}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 font-medium"
                            >
                                ✨ Generate with AI
                            </button>

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
                                    <button
                                        onClick={() => addItem('features', newFeature)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        Add
                                    </button>
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

                            {/* Bug Fixes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bug Fixes</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Add a bug fix"
                                        value={newBugFix}
                                        onChange={(e) => setNewBugFix(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addItem('bug_fixes', newBugFix)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => addItem('bug_fixes', newBugFix)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                                <ul className="space-y-1">
                                    {formData.content.bug_fixes.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center bg-green-50 px-3 py-2 rounded text-sm">
                                            <span>{item}</span>
                                            <button onClick={() => removeItem('bug_fixes', i)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Improvements */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Improvements</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Add an improvement"
                                        value={newImprovement}
                                        onChange={(e) => setNewImprovement(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addItem('improvements', newImprovement)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => addItem('improvements', newImprovement)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                                <ul className="space-y-1">
                                    {formData.content.improvements.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center bg-purple-50 px-3 py-2 rounded text-sm">
                                            <span>{item}</span>
                                            <button onClick={() => removeItem('improvements', i)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                                        </li>
                                    ))}
                                </ul>
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

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReleaseNotes;
