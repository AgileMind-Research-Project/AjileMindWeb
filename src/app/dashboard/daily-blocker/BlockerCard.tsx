import React from 'react';
import { DailyBlocker } from '@/lib/api/dailyBlockersApi';
import { AlertCircle, UserCheck, Lightbulb, Calendar, ExternalLink, MapPin } from 'lucide-react';

interface BlockerCardProps {
    blocker: DailyBlocker;
}

export const BlockerCard: React.FC<BlockerCardProps> = ({ blocker }) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg group">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider px-2 py-0.5 bg-red-50 rounded border border-red-100">
                                {blocker.detected_status}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
                                {blocker.ticket_id}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            Incident Detected
                        </h3>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-200 text-xs font-bold text-gray-700 shadow-sm mb-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        {blocker.project_name}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(blocker.meeting_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
                {/* Description */}
                <div className="mb-8">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Incident Description</h4>
                    <p className="text-lg font-medium text-gray-800 leading-relaxed bg-red-50/30 p-4 rounded-lg border-l-4 border-red-400">
                        "{blocker.blocker_description}"
                    </p>
                </div>

                {/* Grid for AI & Support */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AI Recommendations */}
                    <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-md font-bold text-indigo-900 tracking-tight">AI Recommended Actions</h4>
                        </div>
                        <div className="space-y-3">
                            {blocker.ai_suggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                    <p className="text-sm text-indigo-800/90 font-medium leading-normal">
                                        {suggestion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Path & Specialist */}
                    <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100 flex flex-col justify-between">
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                    <UserCheck className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-md font-bold text-purple-900 tracking-tight">Escalation & Support</h4>
                            </div>

                            <div className="space-y-4">
                                {/* Assignee Info */}
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100 shadow-sm">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-sm">
                                        {blocker.assignee_first_name?.[0] || blocker.assignee_email?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Responsible Specialist</p>
                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                            {blocker.assignee_first_name ? `${blocker.assignee_first_name} ${blocker.assignee_last_name || ''}` : 'Unassigned'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-medium">{blocker.assignee_email || 'Verification pending'}</p>
                                    </div>
                                </div>

                                {/* Support Role */}
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-purple-50">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <UserCheck className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Target Mentor Role</p>
                                        <p className="text-sm font-bold text-gray-700">{blocker.suggested_mentor_role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center mt-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Source Context</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <p className="text-xs font-bold text-gray-600 truncate max-w-[200px] md:max-w-md">{blocker.meeting_title}</p>
                </div>
                <button
                    onClick={() => window.location.href = `/dashboard/tasks-updates?meeting_id=${blocker.meeting_id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                >
                    Full Briefing
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

