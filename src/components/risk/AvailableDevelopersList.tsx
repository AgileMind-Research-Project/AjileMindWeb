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
}

export default function AvailableDevelopersList({ developers, sprintName, onClose }: AvailableDevelopersListProps) {
    if (developers.length === 0) {
        return (
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-semibold text-gray-900">No Available Developers</p>
                        <p className="text-sm text-gray-600 mt-2">All team members are optimally utilized</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <div>
                        <h3 className="text-xl font-bold text-white">Available Developers</h3>
                        {sprintName && (
                            <p className="text-sm text-blue-100 mt-1">{sprintName} • {developers.length} developer{developers.length > 1 ? 's' : ''} with low workload</p>
                        )}
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
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-3">
                        {developers.map((dev, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition"
                            >
                                {/* Developer Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Avatar */}
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
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
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            💡 Consider redistributing tasks to balance team capacity
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
