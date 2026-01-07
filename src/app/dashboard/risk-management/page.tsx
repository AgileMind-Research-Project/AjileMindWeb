'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RiskParametersForm from '@/components/risk/RiskParametersForm';

export default function RiskManagementDashboard() {
    return (
        <DashboardLayout>
            <div>
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-blue-600 mb-2">Risk Management</h1>
                    <p className="text-gray-600">Monitor project risks, configure parameters, and visualize risk metrics</p>
                </div>

                {/* Main Content - Risk Parameters Form */}
                <div className="max-w-7xl">
                    <RiskParametersForm />
                </div>

                {/* Additional Info Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk Levels Guide */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Risk Level Guide
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-8 bg-green-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">LOW</span>
                                </div>
                                <span className="text-sm text-gray-600">0-25% - Project is on track with minimal risks</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-8 bg-yellow-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">MEDIUM</span>
                                </div>
                                <span className="text-sm text-gray-600">26-50% - Some concerns require attention</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-8 bg-orange-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">HIGH</span>
                                </div>
                                <span className="text-sm text-gray-600">51-75% - Significant risks need immediate action</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-8 bg-red-600 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">CRITICAL</span>
                                </div>
                                <span className="text-sm text-gray-600">76-100% - Project is in critical state</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-200 p-6">
                        <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Quick Tips
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Configure risk parameters based on your project's specific needs</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Adjust weights to prioritize risk factors that matter most to your team</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Use visualization options to analyze risks from different perspectives</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Regularly review and update parameters as your project evolves</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
