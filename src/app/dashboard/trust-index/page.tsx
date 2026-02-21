'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrustIndexDashboard from '@/components/trust-index/TrustIndexDashboard';

export default function TrustIndexPage() {
    return (
        <DashboardLayout>
            <div>
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-indigo-600 mb-2">Trust Index</h1>
                    <p className="text-gray-600">
                        A holistic project confidence score based on team availability, velocity consistency,
                        scope stability, historical accuracy, risk level, and delay impact.
                        A score ≥ 80 indicates the project is ready to release.
                    </p>
                </div>

                {/* Main Dashboard */}
                <div className="max-w-7xl">
                    <TrustIndexDashboard />
                </div>

                {/* Info Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Methodology */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Trust Score Guide
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-green-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">80 – 100</span>
                                </div>
                                <span className="text-sm text-gray-600">Ready to Release — all factors healthy</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-yellow-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">60 – 79</span>
                                </div>
                                <span className="text-sm text-gray-600">Caution — some factors need attention</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-orange-500 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">40 – 59</span>
                                </div>
                                <span className="text-sm text-gray-600">Concerning — significant issues present</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-24 h-8 bg-red-600 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">0 – 39</span>
                                </div>
                                <span className="text-sm text-gray-600">Critical — project needs immediate action</span>
                            </div>
                        </div>
                    </div>

                    {/* How it's calculated */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md border border-indigo-200 p-6">
                        <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Calculation Method
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                            {[
                                'Uses the HDI Geometric Mean approach (UN standard since 2010)',
                                'All 6 components are equally weighted — no bias',
                                'Floor value of 1 prevents complete score collapse on zero components',
                                'A low score in any one area pulls the entire index down significantly',
                                'Insights are generated automatically when score < 80',
                            ].map((tip) => (
                                <li key={tip} className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
