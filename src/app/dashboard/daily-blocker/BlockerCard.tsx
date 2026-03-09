import React from 'react';
import { DailyBlocker } from '@/lib/api/dailyBlockersApi';
import { AlertCircle, UserCheck, Lightbulb, Calendar, ExternalLink } from 'lucide-react';

interface BlockerCardProps {
    blocker: DailyBlocker;
}

export const BlockerCard: React.FC<BlockerCardProps> = ({ blocker }) => {
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1 group relative">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Status Indicator Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-gradient-x" />

            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl text-white shadow-lg shadow-red-200 group-hover:rotate-3 transition-transform duration-500">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-200">
                                    Critical Blocker
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-200">
                                    {blocker.ticket_id}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors tracking-tight">
                                Impediment Detected
                            </h3>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-red-200 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-bold text-gray-700">{blocker.project_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(blocker.meeting_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-8">
                {/* Description - Focused & Dramatic */}
                <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-red-500/20 rounded-full" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Incident Log</h4>
                    <p className="text-xl font-medium text-gray-800 leading-relaxed italic">
                        "{blocker.blocker_description}"
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* AI Wisdom Section */}
                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl p-6 border border-blue-100 relative group/ai">
                        <div className="absolute top-4 right-4 text-blue-200 group-hover/ai:text-blue-400 transition-colors">
                            <Lightbulb className="w-10 h-10" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                <span className="text-xs font-bold">AI</span>
                            </div>
                            <h4 className="text-lg font-black text-blue-900">Recommended Actions</h4>
                        </div>

                        <div className="space-y-4">
                            {blocker.ai_suggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex gap-4 group/step">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-blue-200 text-blue-600 flex items-center justify-center text-xs font-black shadow-sm group-hover/step:bg-blue-600 group-hover/step:text-white group-hover/step:border-blue-600 transition-all">
                                        {idx + 1}
                                    </div>
                                    <p className="text-sm text-blue-800/80 font-medium leading-relaxed pt-0.5">
                                        {suggestion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support & Escalation Section */}
                    <div className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 rounded-3xl p-6 border border-purple-100 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-md">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-lg font-black text-purple-900">Support Path</h4>
                            </div>

                            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Strategic Contact</p>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-gradient-to-tr from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                                    <UserCheck className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-purple-500 font-black uppercase tracking-tighter">Assigned Support Role</p>
                                    <p className="text-xl font-black text-purple-900">{blocker.suggested_mentor_role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-purple-100">
                            <p className="text-xs text-purple-600/60 font-medium italic">
                                *AI context-aware matching based on incident technical complexity and risk factors.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Footer */}
            <div className="bg-gray-50/80 backdrop-blur-sm px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="text-xs font-black text-gray-400 uppercase">Context</div>
                    <div className="h-4 w-px bg-gray-200" />
                    <span className="text-sm font-bold text-gray-700">{blocker.meeting_title}</span>
                </div>

                <button
                    onClick={() => window.location.href = `/dashboard/tasks-updates?meeting_id=${blocker.meeting_id}`}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 shadow-sm"
                >
                    Detailed Briefing
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 100%;
                    animation: gradient-x 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

