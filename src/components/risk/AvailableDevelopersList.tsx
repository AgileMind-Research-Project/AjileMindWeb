'use client';

import React from 'react';

interface AvailableDeveloper {
    name: string;
    utilization_percentage: number;
    capacity_status: string;
    total_tasks: number;
    remaining_capacity_hours: number;
    total_capacity_hours: number;
}

interface AvailableDevelopersListProps {
    developers: AvailableDeveloper[];
    sprintName?: string;
    onClose: () => void;
    onBack?: () => void;
}

export default function AvailableDevelopersList({ developers, sprintName, onClose, onBack }: AvailableDevelopersListProps) {
    if (developers.length === 0) {
        return (
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 max-w-md w-full p-6 animate-fade-in">
                    <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-semibold text-gray-900">No Available Developers</p>
                        <p className="text-sm text-gray-600 mt-2">All team members are optimally utilized</p>
                    </div>
                    <div className="mt-6 flex gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Recommendations
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`${onBack ? '' : 'w-full'} flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition shadow-md font-medium`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all mr-1"
                                title="Back to Recommendations"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        )}
                        <div className="bg-white bg-opacity-20 p-2.5 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Available Developers</h3>
                            {sprintName && (
                                <p className="text-sm text-indigo-100 mt-0.5">{sprintName} • {developers.length} developer{developers.length > 1 ? 's' : ''} with low workload</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Developer List */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-indigo-50/50 to-white">
                    <div className="space-y-3">
                        {developers.map((dev, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                {/* Developer Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Avatar */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                                        {dev.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Name and Status */}
                                    <div>
                                        <div className="font-semibold text-gray-900">{dev.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dev.utilization_percentage === 0
                                                ? 'bg-green-100 text-green-700'
                                                : dev.utilization_percentage < 20
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {dev.capacity_status}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {dev.total_tasks} task{dev.total_tasks !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <div className="text-xs text-gray-600">Utilization</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {dev.utilization_percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">Available</div>
                                        <div className="text-lg font-bold text-green-600">
                                            {dev.remaining_capacity_hours.toFixed(0)}h
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-indigo-200 px-6 py-4 bg-indigo-50/50 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all font-medium text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Recommendations
                                </button>
                            )}
                            {!onBack && (
                                <div className="text-xs text-gray-500">
                                    💡 Consider redistributing tasks to balance team capacity
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
