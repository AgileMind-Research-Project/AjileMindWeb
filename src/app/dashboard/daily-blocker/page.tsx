'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dailyBlockersApi, DailyBlocker } from '@/lib/api/dailyBlockersApi';
import { BlockerCard } from './BlockerCard';
import { ShieldAlert, RefreshCcw, Search, Filter, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyBlockersPage() {
    const [blockers, setBlockers] = useState<DailyBlocker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBlockers, setFilteredBlockers] = useState<DailyBlocker[]>([]);

    const fetchBlockers = async () => {
        setLoading(true);
        try {
            const response = await dailyBlockersApi.getDailyBlockers();
            if (response.success) {
                setBlockers(response.data);
                setFilteredBlockers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch blockers:', error);
            toast.error('Failed to load daily blockers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockers();
    }, []);

    useEffect(() => {
        const results = blockers.filter(b =>
            b.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.blocker_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.project_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBlockers(results);
    }, [searchTerm, blockers]);

    const activeProjectCount = new Set(blockers.map(b => b.project_id)).size;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#FDFDFF] p-4 md:p-10">
                {/* Premium Hero Header */}
                <div className="max-w-6xl mx-auto mb-12 relative">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-100/50 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-2xl shadow-gray-200/50">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-xs font-black uppercase tracking-widest">Real-time Analysis</span>
                            </div>
                            <div>
                                <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
                                    Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Blockers</span>
                                </h1>
                                <p className="text-gray-500 font-medium text-lg lg:max-w-xl leading-relaxed">
                                    Detecting impediments from your daily standups and providing AI-driven recovery paths for your team.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={fetchBlockers}
                                className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm transition-all hover:bg-red-600 hover:shadow-xl hover:shadow-red-200 active:scale-95"
                            >
                                <RefreshCcw className={`w-5 h-5 transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                Sync Analysis
                            </button>
                        </div>
                    </div>
                </div>

                {/* Intelligent Stats Bar */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Active Blockers', value: blockers.length, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'Affected Projects', value: activeProjectCount, icon: Filter, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'AI Resolution Rate', value: '98%', icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Avg Recovery Time', value: '4.2h', icon: RefreshCcw, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5 group">
                            <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter & Search Dashboard */}
                <div className="max-w-6xl mx-auto mb-10">
                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-[32px] border border-gray-100 shadow-lg shadow-gray-100/20">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by ticket, project name, or incident details..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border-none rounded-3xl focus:ring-0 focus:bg-white transition-all outline-none font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <select className="pl-14 pr-10 py-5 bg-gray-50/50 rounded-3xl font-black text-sm text-gray-700 border-none outline-none appearance-none cursor-pointer focus:ring-0">
                                    <option>Cross-Project Analysis</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-6xl mx-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <div className="relative">
                                <div className="w-24 h-24 border-8 border-gray-100 rounded-full" />
                                <div className="absolute top-0 w-24 h-24 border-8 border-red-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="mt-8 text-xl font-black text-gray-900 animate-pulse">Running AI Diagnostics...</p>
                            <p className="text-gray-400 font-medium mt-2 tracking-wide uppercase text-xs">Parsing standup transcripts & mapping dependencies</p>
                        </div>
                    ) : filteredBlockers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-10">
                            {filteredBlockers.map((blocker, idx) => (
                                <div key={blocker.id} className="animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <BlockerCard blocker={blocker} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-xl shadow-gray-200/30">
                            <div className="bg-green-50 w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto mb-10 rotate-12">
                                <ShieldAlert className="w-16 h-16 text-green-500 opacity-30" />
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Optimal Performance</h3>
                            <p className="text-gray-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">
                                No critical impediments detected in recent updates. Your team's delivery velocity is currently unobstructed.
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-12 px-10 py-5 bg-gray-900 text-white rounded-3xl font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-gray-200"
                            >
                                Reset Diagnostic Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Premium Footer Stats */}
                {!loading && blockers.length > 0 && (
                    <div className="max-w-6xl mx-auto mt-20 p-12 bg-gradient-to-br from-[#0A0A0B] via-[#16161A] to-[#121214] rounded-[50px] text-white shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-red-600/20" />

                        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                            <div className="max-w-md">
                                <div className="w-16 h-1 bg-gradient-to-r from-red-600 to-orange-500 mb-6" />
                                <h2 className="text-4xl font-black mb-4 tracking-tighter leading-tight">Operational Intelligence Breakdown</h2>
                                <p className="text-gray-400 font-medium text-lg leading-relaxed">Aggregate views of structural bottlenecks across all active engineering cycles.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
                                <div>
                                    <p className="text-6xl font-black text-red-500 tracking-tighter tabular-nums">{blockers.length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-4">Active Impediments</p>
                                </div>
                                <div>
                                    <p className="text-6xl font-black text-white tracking-tighter tabular-nums">98%</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-4">AI Insight Confidence</p>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-6xl font-black text-blue-500 tracking-tighter tabular-nums">Fast</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-4">System Responsiveness</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
                
                :root {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </DashboardLayout>
    );
}

