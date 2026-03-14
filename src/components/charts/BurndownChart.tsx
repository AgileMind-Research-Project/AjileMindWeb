'use client';

import React, { useState, useEffect } from 'react';
import {
    ComposedChart,
    Line,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface BurndownChartProps {
    projectId: string | number;
    delayData?: any;
}

export default function BurndownChart({ projectId, delayData: initialDelayData }: BurndownChartProps) {
    const [delayData, setDelayData] = useState<any>(initialDelayData || null);
    const [loading, setLoading] = useState(!initialDelayData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialDelayData) {
            setDelayData(initialDelayData);
            setLoading(false);
            return;
        }

        if (!projectId) return;

        const fetchDelayData = async () => {
            setLoading(true);
            setError(null);
            try {
                const authStorage = localStorage.getItem('auth-storage');
                if (!authStorage) {
                    setError('Please log in to view burndown data');
                    return;
                }

                const token = JSON.parse(authStorage).state?.accessToken;
                if (!token) {
                    setError('Please log in to view burndown data');
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/delay-analysis`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    setError('Your session has expired. Please log in again.');
                    return;
                }

                if (response.ok) {
                    const result = await response.json();
                    setDelayData(result.data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || 'Failed to fetch delay analysis for burndown');
                    setDelayData(null);
                }
            } catch (err) {
                console.error('Error fetching delay data:', err);
                setError('Network error while fetching burndown data');
                setDelayData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDelayData();
    }, [projectId, initialDelayData]);

    if (!projectId) return null;
    if (loading)
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-md border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="ml-3 text-gray-600">Loading burndown chart...</p>
            </div>
        );
    if (error)
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        );
    if (!delayData || !delayData.sprint_breakdown || delayData.sprint_breakdown.length === 0) return null;

    // Process data for the chart
    const totalSprints = delayData.sprint_breakdown.length;

    // The total project scope is the starting point for burning down
    const totalProjectPoints = delayData.total_story_points ||
        delayData.sprint_breakdown.reduce((sum: number, s: any) => sum + (s.planned_story_points || 0), 0);

    let cumulativeCompleted = 0;

    const chartData = [
        // Day 0 marker
        {
            sprint_name: 'Start',
            idealRemaining: totalProjectPoints,
            actualRemaining: totalProjectPoints,
            rawSprint: null,
            totalPlanned: totalProjectPoints,
        }
    ];

    delayData.sprint_breakdown.forEach((sprint: any, index: number) => {
        // Ideal line drops steadily from total points to 0 over the total sprints
        const idealRemaining = Math.max(0, totalProjectPoints - (totalProjectPoints / totalSprints) * (index + 1));

        // Determine if sprint is in the future based on status or dates
        // If it's a future sprint, we don't draw the "Actual" line for it
        const isCompleted = sprint.status?.toLowerCase() === 'completed' || sprint.status?.toLowerCase() === 'done';
        const isInProgress = sprint.status?.toLowerCase() === 'in progress' || sprint.status?.toLowerCase() === 'active';
        const hasCompletedPoints = (sprint.completed_story_points || 0) > 0;

        let actualRemaining: number | null = null;

        // Only calculate actual remaining if we've actually started/completed the sprint or if points were completed
        if (isCompleted || isInProgress || hasCompletedPoints) {
            cumulativeCompleted += (sprint.completed_story_points || 0);
            actualRemaining = Math.max(0, totalProjectPoints - cumulativeCompleted);
        }

        chartData.push({
            sprint_name: sprint.sprint_name || `Sprint ${index + 1}`,
            idealRemaining: Number(idealRemaining.toFixed(1)),
            actualRemaining: actualRemaining !== null ? Number(actualRemaining.toFixed(1)) : null,
            rawSprint: sprint,
            totalPlanned: totalProjectPoints,
        });
    });

    const CustomChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-4 min-w-[200px]">
                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">{label}</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center text-blue-600 font-semibold">
                            <span>Ideal Remaining:</span>
                            <span>{dataPoint.idealRemaining} SP</span>
                        </div>
                        {dataPoint.actualRemaining !== null && (
                            <div className="flex justify-between items-center text-orange-600 font-semibold">
                                <span>Actual Remaining:</span>
                                <span>{dataPoint.actualRemaining} SP</span>
                            </div>
                        )}
                        {dataPoint.rawSprint && (
                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                                <p>Completed in sprint: <span className="font-semibold text-gray-700">{dataPoint.rawSprint.completed_story_points} SP</span></p>
                                <p>Status: <span className="font-semibold text-gray-700">{dataPoint.rawSprint.status}</span></p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-6 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Sprint Burndown Chart
                </h3>
            </div>

            <div className="p-6">
                {/* Sprint Overview Summary */}
                <div className="flex flex-wrap gap-4 mb-8 justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex space-x-8">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Sprints</p>
                            <p className="text-2xl font-bold text-gray-900">{totalSprints}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Project SP</p>
                            <p className="text-2xl font-bold text-gray-900">{totalProjectPoints.toFixed(0)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed SP</p>
                            <p className="text-2xl font-bold text-gray-900">{cumulativeCompleted.toFixed(0)}</p>
                        </div>
                    </div>
                    {delayData.scope_analysis?.has_scope_creep && (
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 font-semibold text-sm flex items-center">
                            <span className="text-xl mr-2">⚠️</span>
                            Scope Creep Detected: +{delayData.scope_analysis.scope_change_story_points.toFixed(0)} SP
                        </div>
                    )}
                </div>

                {/* The Chart */}
                <div className="h-80 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="sprint_name"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                tickMargin={10}
                                axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 'dataMax + 10']}
                            />
                            <RechartsTooltip content={<CustomChartTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {/* Ideal Burndown Line */}
                            <Line
                                type="monotone"
                                dataKey="idealRemaining"
                                name="Ideal Remaining SP"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4, fill: '#3b82f6' }}
                                activeDot={{ r: 6 }}
                            />

                            {/* Actual Burndown Line */}
                            <Line
                                type="monotone"
                                dataKey="actualRemaining"
                                name="Actual Remaining SP"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{ r: 6, fill: '#f97316' }}
                                activeDot={{ r: 8 }}
                                connectNulls={false}
                            />

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
