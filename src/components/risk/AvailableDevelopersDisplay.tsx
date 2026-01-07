'use client';

import React, { useState } from 'react';

interface AvailableDeveloper {
    name: string;
    utilization_percentage: number;
    capacity_status: string;
    total_tasks: number;
    uncompleted_tasks: number;
    completed_tasks: number;
    story_points: number;
    estimated_hours: number;
    remaining_capacity_hours: number;
    total_capacity_hours: number;
    leave_hours: number;
}

interface SprintInfo {
    sprint_id: number;
    sprint_name: string;
    total_capacity_hours: number;
    used_capacity_hours: number;
    available_capacity_hours: number;
    sprint_utilization_percentage: number;
}

interface AvailableDevelopersData {
    available_developers: AvailableDeveloper[];
    threshold_percentage: number;
    total_developers: number;
    available_count: number;
    has_active_sprint: boolean;
    sprint_info: SprintInfo | null;
}

interface AvailableDevelopersDisplayProps {
    data: AvailableDevelopersData;
}

export default function AvailableDevelopersDisplay({ data }: AvailableDevelopersDisplayProps) {
    const [showModal, setShowModal] = useState(false);

    // Don't show anything if no active sprint or no available developers
    if (!data.has_active_sprint || data.available_count === 0) {
        return null;
    }

    return (
        <>
            {/* Recommendation Card */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-md animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Available Developers Detected</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {data.available_count} developer{data.available_count > 1 ? 's' : ''} have low workload (&lt; {data.threshold_percentage}% utilization)
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 bg-white bg-opacity-60 rounded-lg p-3 border border-blue-100">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-semibold text-gray-900">💡 Recommendation:</span> Consider redistributing tasks to balance team capacity and optimize sprint throughput.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-3 flex flex-wrap gap-3">
                            <div className="bg-white bg-opacity-70 px-3 py-2 rounded-lg border border-blue-100">
                                <div className="text-xs text-gray-600">Sprint</div>
                                <div className="text-sm font-bold text-gray-900">{data.sprint_info?.sprint_name}</div>
                            </div>
                            <div className="bg-white bg-opacity-70 px-3 py-2 rounded-lg border border-blue-100">
                                <div className="text-xs text-gray-600">Available Developers</div>
                                <div className="text-sm font-bold text-blue-600">{data.available_count} / {data.total_developers}</div>
                            </div>
                            <div className="bg-white bg-opacity-70 px-3 py-2 rounded-lg border border-blue-100">
                                <div className="text-xs text-gray-600">Sprint Utilization</div>
                                <div className="text-sm font-bold text-gray-900">{data.sprint_info?.sprint_utilization_percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        View Developers
                    </button>
                </div>
            </div>

            {/* Available Developers Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Available Developers</h2>
                                    <p className="text-sm text-blue-100 mt-0.5">
                                        {data.sprint_info?.sprint_name} • Threshold: &lt; {data.threshold_percentage}% Utilization
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Sprint Info Banner */}
                        {data.sprint_info && (
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Total Capacity</div>
                                        <div className="text-lg font-bold text-gray-900">{data.sprint_info.total_capacity_hours.toFixed(0)}h</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Used Capacity</div>
                                        <div className="text-lg font-bold text-orange-600">{data.sprint_info.used_capacity_hours.toFixed(0)}h</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Available Capacity</div>
                                        <div className="text-lg font-bold text-green-600">{data.sprint_info.available_capacity_hours.toFixed(0)}h</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Utilization</div>
                                        <div className="text-lg font-bold text-blue-600">{data.sprint_info.sprint_utilization_percentage.toFixed(1)}%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {data.available_developers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-lg font-semibold">No available developers</p>
                                    <p className="text-sm mt-1">All team members are optimally utilized</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.available_developers.map((developer, index) => (
                                        <div
                                            key={index}
                                            className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                                        >
                                            {/* Developer Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                                                        {developer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">{developer.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${developer.utilization_percentage === 0
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : developer.utilization_percentage < 20
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-purple-100 text-purple-700'
                                                                }`}>
                                                                {developer.capacity_status}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                {developer.utilization_percentage.toFixed(1)}% Utilized
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remaining Capacity Badge */}
                                                <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-md">
                                                    <div className="text-xs opacity-90">Available</div>
                                                    <div className="text-2xl font-bold">{developer.remaining_capacity_hours.toFixed(0)}h</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                    <span>Capacity Utilization</span>
                                                    <span className="font-semibold">{developer.estimated_hours.toFixed(0)}h / {developer.total_capacity_hours.toFixed(0)}h</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${developer.utilization_percentage < 20
                                                                ? 'bg-gradient-to-r from-green-400 to-green-500'
                                                                : 'bg-gradient-to-r from-blue-400 to-purple-500'
                                                            }`}
                                                        style={{ width: `${developer.utilization_percentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="text-xs text-gray-600 mb-1">Total Tasks</div>
                                                    <div className="text-lg font-bold text-gray-900">{developer.total_tasks}</div>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                    <div className="text-xs text-blue-700 mb-1">Uncompleted</div>
                                                    <div className="text-lg font-bold text-blue-700">{developer.uncompleted_tasks}</div>
                                                </div>
                                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                    <div className="text-xs text-green-700 mb-1">Completed</div>
                                                    <div className="text-lg font-bold text-green-700">{developer.completed_tasks}</div>
                                                </div>
                                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                                    <div className="text-xs text-purple-700 mb-1">Story Points</div>
                                                    <div className="text-lg font-bold text-purple-700">{developer.story_points}</div>
                                                </div>
                                            </div>

                                            {/* Leave Info */}
                                            {developer.leave_hours > 0 && (
                                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs text-yellow-800">
                                                        <span className="font-semibold">{developer.leave_hours}h</span> leave scheduled
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                💡 Tip: Assign pending tasks to available developers to balance workload
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
