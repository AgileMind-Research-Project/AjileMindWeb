'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DelayManagementDashboard from '@/components/delay/DelayManagementDashboard';

export default function DelayManagement() {
    return (
        <DashboardLayout>
            <div>
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-indigo-600 mb-2">Delay Management</h1>
                    <p className="text-gray-600">Monitor project delays, analyze delay patterns, and track task completion timelines</p>
                </div>

                {/* Main Content - Delay Management Dashboard */}
                <div className="max-w-7xl">
                    <DelayManagementDashboard />
                </div>

                {/* Additional Info Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delay Risk Level Guide */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Project Delay Risk Levels
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-green-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">LOW</span>
                                </div>
                                <span className="text-sm text-gray-600">&lt; 10% delay - Project on track</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-yellow-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">MEDIUM</span>
                                </div>
                                <span className="text-sm text-gray-600">10-25% delay - Monitor closely</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-orange-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">HIGH</span>
                                </div>
                                <span className="text-sm text-gray-600">25-40% delay - Intervention required</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-red-600 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">CRITICAL</span>
                                </div>
                                <span className="text-sm text-gray-600">≥ 40% delay - Immediate action needed</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 italic">
                                Risk levels calculated using velocity analysis, sprint completion, and developer availability metrics
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md border border-indigo-200 p-6">
                        <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Delay Management Tips
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Identify patterns in delayed tasks to prevent future delays</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Monitor team workload to balance task distribution</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Use delay analytics to improve sprint planning accuracy</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Set up proactive alerts for tasks approaching deadlines</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
