'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import BurndownChart from '@/components/charts/BurndownChart';

interface SprintBreakdown {
    sprint_id: number;
    sprint_name: string;
    start_date: string;
    end_date: string;
    status: string;
    planned_story_points: number;
    completed_story_points: number;
    completion_rate: number;
    velocity: number;
    total_hours: number;
    leave_hours: number;
    availability: number;
}

interface ConfidenceForecasts {
    best_case_end_date: string;
    most_likely_end_date: string;
    worst_case_end_date: string;
    best_case_velocity: number;
    most_likely_velocity: number;
    worst_case_velocity: number;
    confidence_range_days: number;
}

interface VelocityTrend {
    trend_direction: 'ACCELERATING' | 'DECELERATING' | 'STABLE';
    trend_value: number;
    recent_avg_velocity: number;
    overall_avg_velocity: number;
    is_improving: boolean;
    is_declining: boolean;
}

interface ScopeAnalysis {
    original_planned_story_points: number;
    current_total_story_points: number;
    scope_change_story_points: number;
    scope_change_ratio: number;
    scope_change_percentage: number;
    has_scope_creep: boolean;
}

interface DelayAttribution {
    velocity_impact_days: number;
    availability_impact_days: number;
    scope_impact_days: number;
    velocity_impact_percentage: number;
    availability_impact_percentage: number;
    scope_impact_percentage: number;
    primary_cause: 'LOW_VELOCITY' | 'AVAILABILITY' | 'SCOPE_CHANGE' | 'NONE';
}

interface EarlyWarning {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    recommendation: string;
}

interface DelayAnalysis {
    project_id: number;
    project_name: string;
    project_key: string;

    // Dates
    project_start_date: string;
    planned_end_date: string;
    current_date: string;
    forecasted_end_date: string;

    // Sprint configuration
    sprint_size_weeks: number;
    sprint_size_days: number;

    // Sprint delay metrics
    planned_total_sprints: number;
    total_sprints: number;
    completed_sprints: number;
    forecasted_remaining_sprints: number;
    forecasted_total_sprints: number;
    sprint_delay: number;

    // Delay metrics
    delay_days: number;
    delay_percentage: number;
    risk_level: string;

    // Project metrics
    project_duration_days: number;
    days_elapsed: number;

    // Story points
    total_story_points: number;
    completed_story_points: number;
    remaining_story_points: number;
    story_point_completion_rate: number;

    // Velocity
    expected_velocity: number;
    actual_velocity: number;
    velocity_variance: number;

    // Availability
    total_planned_hours: number;
    total_leave_hours: number;
    availability_ratio: number;

    // Enhanced Features
    confidence_forecasts: ConfidenceForecasts;
    velocity_trend: VelocityTrend;
    scope_analysis: ScopeAnalysis;
    delay_attribution: DelayAttribution;
    early_warnings: EarlyWarning[];

    // Sprint breakdown
    sprint_breakdown: SprintBreakdown[];
    message?: string;
}

export default function DelayManagementDashboard() {
    const { user } = useAuth();
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [projects, setProjects] = useState<any[]>([]);
    const [delayData, setDelayData] = useState<DelayAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSprintBreakdown, setShowSprintBreakdown] = useState(false);
    const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);
    const [llmLoading, setLlmLoading] = useState(false);
    const [llmError, setLlmError] = useState<string | null>(null);

    // Fetch projects
    useEffect(() => {
        fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage) {
                setError('Please log in to view projects');
                return;
            }

            const token = JSON.parse(authStorage).state?.accessToken;
            if (!token) {
                setError('Please log in to view projects');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/projects/?page=1&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                setError('Your session has expired. Please log in again.');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const result = await response.json();
            setProjects(result.data || []);
            // Don't auto-select first project - wait for user to choose
            // This prevents automatic delay calculation on page load
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
        }
    };


    // Fetch delay data when project changes
    useEffect(() => {
        if (selectedProject) {
            fetchDelayData();
        }
    }, [selectedProject]);

    const fetchDelayData = async () => {
        if (!selectedProject) return;

        setLoading(true);
        setError(null);
        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage) {
                setError('Please log in to view delay analysis');
                return;
            }

            const token = JSON.parse(authStorage).state?.accessToken;
            if (!token) {
                setError('Please log in to view delay analysis');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${apiUrl}/api/v1/projects/${selectedProject}/delay-analysis`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (response.status === 401) {
                setError('Your session has expired. Please log in again.');
                return;
            }

            if (response.ok) {
                const result = await response.json();
                // Extract the actual delay data from the nested 'data' property
                setDelayData(result.data);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to fetch delay analysis');
                setDelayData(null);
            }
        } catch (error) {
            console.error('Error fetching delay data:', error);
            setError('Network error while fetching delay analysis');
            setDelayData(null);
        } finally {
            setLoading(false);
        }
    };

    const generateAiSuggestions = async () => {
        if (!selectedProject) return;
        setLlmLoading(true);
        setLlmError(null);
        setLlmSuggestions([]);
        try {
            const authStorage = localStorage.getItem('auth-storage');
            const token = JSON.parse(authStorage || '{}').state?.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${apiUrl}/api/v1/projects/${selectedProject}/delay-suggestions`,
                { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
            );
            const result = await response.json();
            if (!response.ok) {
                setLlmError(result.detail || 'Failed to generate suggestions');
            } else {
                setLlmSuggestions(result.data?.suggestions || []);
            }
        } catch {
            setLlmError('Network error while generating suggestions');
        } finally {
            setLlmLoading(false);
        }
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'LOW':
                return 'from-green-500 to-green-600';
            case 'MEDIUM':
                return 'from-yellow-500 to-yellow-600';
            case 'HIGH':
                return 'from-orange-500 to-orange-600';
            case 'CRITICAL':
                return 'from-red-500 to-red-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'LOW':
                return '✓';
            case 'MEDIUM':
                return '⚠';
            case 'HIGH':
                return '⚠';
            case 'CRITICAL':
                return '⛔';
            default:
                return '?';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Project Selection */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Project
                </label>
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                >
                    <option value="">-- Select a Project --</option>
                    {projects.map((project) => (
                        <option key={project.project_id} value={project.project_id}>
                            {project.project_name} ({project.key})
                        </option>
                    ))}
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Date Timeline Card */}
            {delayData && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Project Timeline
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Start Date */}
                            <div className="text-center">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Start Date</p>
                                <p className="text-lg font-bold text-gray-900">{formatDate(delayData.project_start_date)}</p>
                            </div>

                            {/* Planned End Date */}
                            <div className="text-center border-l border-r border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Planned End Date</p>
                                <p className="text-lg font-bold text-blue-600">{formatDate(delayData.planned_end_date)}</p>
                            </div>

                            {/* Forecasted End Date */}
                            <div className="text-center">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forecasted End Date</p>
                                <p className={`text-lg font-bold ${delayData.delay_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatDate(delayData.forecasted_end_date)}
                                </p>
                                {delayData.delay_days > 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        +{(delayData.delay_days ?? 0).toFixed(1)} days delay
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delay Statistics Dashboard */}
            {delayData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Risk Level */}
                    <div className={`bg-gradient-to-br ${getRiskColor(delayData.risk_level)} rounded-xl shadow-lg p-6 text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Risk Level</p>
                                <p className="text-3xl font-bold mt-2">{delayData.risk_level}</p>
                                <p className="text-white/80 text-xs mt-1">{(delayData.delay_percentage ?? 0).toFixed(1)}% delay</p>
                            </div>
                            <div className="text-5xl opacity-50">{getRiskIcon(delayData.risk_level)}</div>
                        </div>
                    </div>

                    {/* Sprint Progress */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Sprint Progress</p>
                                <p className="text-3xl font-bold mt-2">{delayData.completed_sprints ?? 0}/{delayData.total_sprints ?? 0}</p>
                                <p className="text-blue-100 text-xs mt-1">
                                    {(delayData.total_sprints ?? 0) > 0
                                        ? (((delayData.completed_sprints ?? 0) / (delayData.total_sprints ?? 1)) * 100).toFixed(1)
                                        : 0}% complete
                                </p>
                            </div>
                            <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>

                    {/* Story Points */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Story Points</p>
                                <p className="text-3xl font-bold mt-2">{delayData.completed_story_points ?? 0}/{delayData.total_story_points ?? 0}</p>
                                <p className="text-purple-100 text-xs mt-1">{(delayData.story_point_completion_rate ?? 0).toFixed(1)}% complete</p>
                            </div>
                            <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                    </div>

                    {/* Velocity */}
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-teal-100 text-sm font-medium">Velocity</p>
                                <p className="text-3xl font-bold mt-2">{(delayData.actual_velocity ?? 0).toFixed(1)}</p>
                                <p className={`text-xs mt-1 ${(delayData.velocity_variance ?? 0) >= 0 ? 'text-teal-100' : 'text-red-200'}`}>
                                    {(delayData.velocity_variance ?? 0) >= 0 ? '+' : ''}{(delayData.velocity_variance ?? 0).toFixed(1)} vs expected
                                </p>
                            </div>
                            <svg className="w-12 h-12 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Metrics */}
            {delayData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Developer Availability */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Developer Availability
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Availability Ratio:</span>
                                <span className="font-semibold text-gray-900">{((delayData.availability_ratio ?? 0) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Leave Hours:</span>
                                <span className="font-semibold text-gray-900">{delayData.total_leave_hours ?? 0}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Planned Hours:</span>
                                <span className="font-semibold text-gray-900">{delayData.total_planned_hours ?? 0}h</span>
                            </div>
                        </div>
                    </div>

                    {/* Project Duration */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Project Duration
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Duration:</span>
                                <span className="font-semibold text-gray-900">{delayData.project_duration_days ?? 0} days</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sprint Size:</span>
                                <span className="font-semibold text-gray-900">{delayData.sprint_size_days ?? 0} days ({delayData.sprint_size_weeks ?? 0}w)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Days Elapsed:</span>
                                <span className="font-semibold text-gray-900">{delayData.days_elapsed ?? 0} days</span>
                            </div>
                        </div>
                    </div>

                    {/* Remaining Work */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Remaining Work
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Remaining Points:</span>
                                <span className="font-semibold text-gray-900">{delayData.remaining_story_points ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sprint Delay:</span>
                                <span className="font-semibold text-red-600">{(delayData.sprint_delay ?? 0).toFixed(1)} sprints</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Forecasted Remaining:</span>
                                <span className="font-semibold text-gray-900">{(delayData.forecasted_remaining_sprints ?? 0).toFixed(1)} sprints</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ENHANCEMENT 1: Confidence-Based Forecast Timeline */}
            {delayData && delayData.confidence_forecasts && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Confidence-Based Forecast (Best/Most Likely/Worst Case)
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Best Case */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Best Case</span>
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <p className="text-lg font-bold text-green-900">{formatDate(delayData.confidence_forecasts.best_case_end_date)}</p>
                                <p className="text-xs text-green-700 mt-1">Velocity: {delayData.confidence_forecasts.best_case_velocity.toFixed(1)} SP/sprint</p>
                            </div>

                            {/* Most Likely */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Most Likely</span>
                                    <span className="text-2xl">📊</span>
                                </div>
                                <p className="text-lg font-bold text-blue-900">{formatDate(delayData.confidence_forecasts.most_likely_end_date)}</p>
                                <p className="text-xs text-blue-700 mt-1">Velocity: {delayData.confidence_forecasts.most_likely_velocity.toFixed(1)} SP/sprint</p>
                            </div>

                            {/* Worst Case */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Worst Case</span>
                                    <span className="text-2xl">⚠️</span>
                                </div>
                                <p className="text-lg font-bold text-red-900">{formatDate(delayData.confidence_forecasts.worst_case_end_date)}</p>
                                <p className="text-xs text-red-700 mt-1">Velocity: {delayData.confidence_forecasts.worst_case_velocity.toFixed(1)} SP/sprint</p>
                            </div>
                        </div>

                        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold">Confidence Range:</span> {delayData.confidence_forecasts.confidence_range_days} days
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ENHANCEMENT 2: Velocity Trend + ENHANCEMENT 3: Scope Change */}
            {delayData && delayData.velocity_trend && delayData.scope_analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Velocity Trend Card */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Velocity Trend Analysis
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {delayData.velocity_trend.trend_direction}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {delayData.velocity_trend.is_improving && '📈 Team is accelerating'}
                                        {delayData.velocity_trend.is_declining && '📉 Team is slowing down'}
                                        {!delayData.velocity_trend.is_improving && !delayData.velocity_trend.is_declining && '➡️ Velocity is stable'}
                                    </p>
                                </div>
                                <div className={`text-5xl ${delayData.velocity_trend.is_improving ? 'text-green-500' : delayData.velocity_trend.is_declining ? 'text-red-500' : 'text-gray-400'}`}>
                                    {delayData.velocity_trend.is_improving && '↗'}
                                    {delayData.velocity_trend.is_declining && '↘'}
                                    {!delayData.velocity_trend.is_improving && !delayData.velocity_trend.is_declining && '→'}
                                </div>
                            </div>

                            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Recent Avg Velocity:</span>
                                    <span className="font-semibold text-gray-900">{delayData.velocity_trend.recent_avg_velocity.toFixed(1)} SP</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Overall Avg Velocity:</span>
                                    <span className="font-semibold text-gray-900">{delayData.velocity_trend.overall_avg_velocity.toFixed(1)} SP</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Trend Value:</span>
                                    <span className={`font-semibold ${delayData.velocity_trend.trend_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {delayData.velocity_trend.trend_value >= 0 ? '+' : ''}{delayData.velocity_trend.trend_value.toFixed(1)} SP
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scope Change Card */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                Scope Change Detection
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {delayData.scope_analysis.scope_change_percentage >= 0 ? '+' : ''}{delayData.scope_analysis.scope_change_percentage.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {delayData.scope_analysis.has_scope_creep ? '⚠️ Significant scope creep detected' : '✅ Scope is under control'}
                                    </p>
                                </div>
                                <div className={`text-5xl ${delayData.scope_analysis.has_scope_creep ? 'text-red-500' : 'text-green-500'}`}>
                                    {delayData.scope_analysis.has_scope_creep ? '📈' : '✓'}
                                </div>
                            </div>

                            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Original Planned SP:</span>
                                    <span className="font-semibold text-gray-900">{delayData.scope_analysis.original_planned_story_points.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Current Total SP:</span>
                                    <span className="font-semibold text-gray-900">{delayData.scope_analysis.current_total_story_points}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Scope Change:</span>
                                    <span className={`font-semibold ${delayData.scope_analysis.scope_change_story_points >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {delayData.scope_analysis.scope_change_story_points >= 0 ? '+' : ''}{delayData.scope_analysis.scope_change_story_points.toFixed(0)} SP
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ENHANCEMENT 4: Delay Attribution Breakdown */}
            {delayData && delayData.delay_attribution && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                            Delay Attribution Breakdown (Root Cause Analysis)
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Attribution Chart */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Delay Contribution by Factor</h4>
                                <div className="space-y-3">
                                    {/* Velocity Impact */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">🐌 Low Velocity</span>
                                            <span className="font-semibold text-gray-900">{delayData.delay_attribution.velocity_impact_percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${delayData.delay_attribution.velocity_impact_percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{delayData.delay_attribution.velocity_impact_days.toFixed(1)} days</p>
                                    </div>

                                    {/* Availability Impact */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">👥 Team Availability</span>
                                            <span className="font-semibold text-gray-900">{delayData.delay_attribution.availability_impact_percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${delayData.delay_attribution.availability_impact_percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{delayData.delay_attribution.availability_impact_days.toFixed(1)} days</p>
                                    </div>

                                    {/* Scope Impact */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">📦 Scope Change</span>
                                            <span className="font-semibold text-gray-900">{delayData.delay_attribution.scope_impact_percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${delayData.delay_attribution.scope_impact_percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{delayData.delay_attribution.scope_impact_days.toFixed(1)} days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Cause */}
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-600 mb-3">Primary Delay Cause</p>
                                    <div className={`inline-block px-6 py-4 rounded-xl ${delayData.delay_attribution.primary_cause === 'LOW_VELOCITY' ? 'bg-blue-100 border-2 border-blue-500' :
                                        delayData.delay_attribution.primary_cause === 'AVAILABILITY' ? 'bg-orange-100 border-2 border-orange-500' :
                                            delayData.delay_attribution.primary_cause === 'SCOPE_CHANGE' ? 'bg-purple-100 border-2 border-purple-500' :
                                                'bg-gray-100 border-2 border-gray-500'
                                        }`}>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {delayData.delay_attribution.primary_cause === 'LOW_VELOCITY' && '🐌 Low Velocity'}
                                            {delayData.delay_attribution.primary_cause === 'AVAILABILITY' && '👥 Availability'}
                                            {delayData.delay_attribution.primary_cause === 'SCOPE_CHANGE' && '📦 Scope Change'}
                                            {delayData.delay_attribution.primary_cause === 'NONE' && '✅ No Delay'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        {delayData.delay_attribution.primary_cause === 'LOW_VELOCITY' && 'Team velocity is below expected rate'}
                                        {delayData.delay_attribution.primary_cause === 'AVAILABILITY' && 'Leave hours are impacting delivery'}
                                        {delayData.delay_attribution.primary_cause === 'SCOPE_CHANGE' && 'Project scope has increased'}
                                        {delayData.delay_attribution.primary_cause === 'NONE' && 'Project is on track'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ENHANCEMENT 5: Early Warning System */}
            {delayData && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Early Warning System
                            {delayData.early_warnings && delayData.early_warnings.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-red-100">
                                    ({delayData.early_warnings.length} Alert{delayData.early_warnings.length !== 1 ? 's' : ''})
                                </span>
                            )}
                        </h3>
                        {/* Generate AI Suggestions Button */}
                        <button
                            onClick={generateAiSuggestions}
                            disabled={llmLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-white/30"
                        >
                            {llmLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Generating suggestions...
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    Suggestions
                                </>
                            )}
                        </button>
                    </div>

                    {(
                        (delayData.early_warnings && delayData.early_warnings.length > 0) ||
                        llmLoading || llmError || llmSuggestions.length > 0
                    ) && (
                            <div className="p-6 space-y-5">
                                {/* Existing Early Warnings */}
                                {delayData.early_warnings && delayData.early_warnings.length > 0 && (
                                    <div className="space-y-4">
                                        {delayData.early_warnings.map((warning, index) => (
                                            <div
                                                key={index}
                                                className={`rounded-lg p-4 border-l-4 ${warning.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                                                    warning.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                                                        warning.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                                                            'bg-blue-50 border-blue-500'
                                                    }`}
                                            >
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <span className="text-2xl">
                                                            {warning.severity === 'CRITICAL' && '🚨'}
                                                            {warning.severity === 'HIGH' && '⚠️'}
                                                            {warning.severity === 'MEDIUM' && '⚡'}
                                                            {warning.severity === 'LOW' && 'ℹ️'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-sm font-bold text-gray-900">{warning.type.replace(/_/g, ' ')}</h4>
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${warning.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                                                                warning.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                                                                    warning.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                                                        'bg-blue-200 text-blue-800'
                                                                }`}>
                                                                {warning.severity}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-2">{warning.message}</p>
                                                        <div className="bg-white bg-opacity-50 rounded p-2 mt-2">
                                                            <p className="text-xs font-semibold text-gray-600 mb-1">💡 Recommendation:</p>
                                                            <p className="text-xs text-gray-700">{warning.recommendation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* LLM Error */}
                                {llmError && (
                                    <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-sm text-red-700">
                                        ⚠️ {llmError}
                                    </div>
                                )}

                                {/* LLM Spinner */}
                                {llmLoading && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <svg className="w-10 h-10 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-600">Generating suggestions...</p>
                                        <p className="text-xs text-gray-400">AI is analysing delay data, this may take a moment</p>
                                    </div>
                                )}

                                {/* AI Suggestions */}
                                {!llmLoading && llmSuggestions.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">✨</span>
                                            <h4 className="text-sm font-bold text-gray-800">AI Recovery Suggestions</h4>
                                            <span className="text-xs text-gray-400 italic">powered by llama3.2</span>
                                        </div>
                                        <div className="space-y-3">
                                            {llmSuggestions.map((suggestion, idx) => (
                                                <div key={idx} className="flex gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="text-sm text-gray-800 leading-relaxed">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            )}

            {/* ENHANCEMENT 6: Sprint Burndown Chart */}
            {delayData && delayData.sprint_breakdown && delayData.sprint_breakdown.length > 0 && (
                <BurndownChart projectId={selectedProject} delayData={delayData} />
            )}

            {/* Sprint Breakdown Section */}
            {delayData && delayData.sprint_breakdown && delayData.sprint_breakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Sprint-wise Breakdown
                        </h3>
                        <button
                            onClick={() => setShowSprintBreakdown(!showSprintBreakdown)}
                            className="text-white hover:text-indigo-100 transition-colors"
                        >
                            {showSprintBreakdown ? '▼' : '▶'}
                        </button>
                    </div>

                    {showSprintBreakdown && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sprint</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Story Points</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completion</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Velocity</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Availability</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {delayData.sprint_breakdown.map((sprint) => (
                                        <tr key={sprint.sprint_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{sprint.sprint_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sprint.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    sprint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {sprint.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {sprint.completed_story_points}/{sprint.planned_story_points}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className={`h-2 rounded-full ${sprint.completion_rate >= 100 ? 'bg-green-500' :
                                                                sprint.completion_rate >= 70 ? 'bg-blue-500' :
                                                                    sprint.completion_rate >= 40 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                }`}
                                                            style={{ width: `${Math.min(sprint.completion_rate, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700">{(sprint.completion_rate ?? 0).toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{Number(sprint.velocity ?? 0).toFixed(1)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{Number(sprint.availability ?? 0).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Calculating delay analysis...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !delayData && selectedProject && !error && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Delay Data Available</h3>
                    <p className="text-gray-500">Select a project to view delay analytics and statistics.</p>
                </div>
            )}

            {/* No Project Selected */}
            {!loading && !selectedProject && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-300 p-12 text-center">
                    <svg className="w-16 h-16 text-indigo-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Select a Project</h3>
                    <p className="text-indigo-700">Choose a project from the dropdown above to view comprehensive delay analysis.</p>
                </div>
            )}
        </div>
    );
}
