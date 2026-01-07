'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import AvailableDevelopersList from './AvailableDevelopersList';

// Color palette for different parameters
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#f97316', '#14b8a6', '#84cc16'];

// Risk Chart View Component
interface RiskChartViewProps {
    data: any[];
    type: 'pie' | 'bar' | 'line';
}

const RiskChartView: React.FC<RiskChartViewProps> = ({ data, type }) => {
    // Transform data for charts
    const chartData = data.map((item: any) => ({
        name: item.parameter.replace(/_/g, ' ').split(' ').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        value: ((item.risk_score || 0) * 100),
        percentage: ((item.risk_score || 0) * 100).toFixed(1),
        weight: item.weight,
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
                    <p className="text-sm text-gray-600">Risk: {payload[0].payload.percentage}%</p>
                    <p className="text-sm text-gray-600">Weight: {payload[0].payload.weight}</p>
                </div>
            );
        }
        return null;
    };

    if (type === 'pie') {
        return (
            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'bar') {
        return (
            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            interval={0}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis label={{ value: 'Risk %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#3b82f6">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'line') {
        return (
            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            interval={0}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis label={{ value: 'Risk %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 6 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return null;
};

interface RiskParameter {
    name: string;
    label: string;
    description: string;
    enabled: boolean;
    weight: number;
}

interface RiskParametersFormProps {
    projectId?: number;
    onSuccess?: () => void;
}

export default function RiskParametersForm({ projectId, onSuccess }: RiskParametersFormProps) {
    const [loading, setLoading] = useState(false);
    const [loadingParameters, setLoadingParameters] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | string>(projectId || '');
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [riskData, setRiskData] = useState<{
        risk_level: string;
        risk_percentage: number;
        total_risk_score: number;
        breakdown?: any[];
        metadata?: any;
    } | null>(null);
    const [loadingRisk, setLoadingRisk] = useState(false);
    const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);
    const [showParametersConfig, setShowParametersConfig] = useState(false);
    const [visualizationType, setVisualizationType] = useState<'list' | 'pie' | 'bar' | 'line'>('list');
    const [showInsights, setShowInsights] = useState<string | null>(null);
    const [showRecommendations, setShowRecommendations] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [showAvailableDevelopers, setShowAvailableDevelopers] = useState(false);
    const [availableDevelopersData, setAvailableDevelopersData] = useState<any>(null);

    const [parameters, setParameters] = useState<RiskParameter[]>([
        {
            name: 'uncompleted_tasks',
            label: 'Uncompleted Tasks',
            description: 'Number of incomplete tasks in the project',
            enabled: false,
            weight: 0,
        },
        {
            name: 'detected_bugs',
            label: 'Detected Bugs',
            description: 'Number of bugs found in the project',
            enabled: false,
            weight: 0,
        },
        {
            name: 'blockers_count',
            label: 'Blockers Count',
            description: 'Number of blocking issues',
            enabled: false,
            weight: 0,
        },
        {
            name: 'task_dependency',
            label: 'Task Dependency',
            description: 'Number of task dependencies',
            enabled: false,
            weight: 0,
        },
        {
            name: 'timeline_conflict',
            label: 'Timeline Conflict',
            description: 'Conflicts in project timeline',
            enabled: false,
            weight: 0,
        },
        {
            name: 'developer_availability',
            label: 'Developer Availability',
            description: 'Availability status of team members',
            enabled: false,
            weight: 0,
        },
        {
            name: 'task_progress',
            label: 'Task Progress',
            description: 'Overall task completion progress',
            enabled: false,
            weight: 0,
        },
        {
            name: 'sprint_completion_level',
            label: 'Sprint Completion Level',
            description: 'Sprint completion percentage',
            enabled: false,
            weight: 0,
        },
        {
            name: 'project_budget',
            label: 'Project Budget',
            description: 'Budget tracking and variance',
            enabled: false,
            weight: 0,
        },
    ]);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, []);

    // Fetch risk parameters when project is selected
    useEffect(() => {
        if (selectedProjectId) {
            fetchRiskParameters(Number(selectedProjectId));
        } else {
            // Reset to default state when no project is selected
            resetParameters();
            setIsUpdateMode(false);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        setLoadingProjects(true);
        console.log('🔍 Fetching projects...');
        try {
            const authStorage = localStorage.getItem('auth-storage');
            console.log('📦 Auth storage:', authStorage ? 'Found' : 'Not found');

            const token = JSON.parse(authStorage || '{}').state?.accessToken;
            console.log('🔑 Token:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');

            if (!token) {
                setErrorMessage('Please log in to view projects');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            console.log('🌐 API URL:', `${apiUrl}/api/v1/projects/?page=1&limit=100`);

            const response = await fetch(`${apiUrl}/api/v1/projects/?page=1&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('📡 Response status:', response.status);

            if (response.status === 401) {
                console.error('❌ Unauthorized - Token expired');
                setErrorMessage('Your session has expired. Please log in again.');
                return;
            }

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status);
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            console.log('📊 Projects data:', data);
            console.log('📋 Projects array:', data.data);
            console.log('🔢 Number of projects:', data.data?.length || 0);

            setProjects(data.data || []);
        } catch (err: any) {
            console.error('💥 Error fetching projects:', err);
            setErrorMessage(err.message || 'Failed to load projects');
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchRiskParameters = async (projectId: number) => {
        setLoadingParameters(true);
        setErrorMessage('');

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            if (!token) {
                setErrorMessage('Please log in to continue');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/risk-parameters/get/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                setErrorMessage('Your session has expired. Redirecting to login...');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            if (response.status === 404) {
                // No parameters found - this is a new project, use create mode
                console.log('No existing parameters found for project', projectId);
                resetParameters();
                setIsUpdateMode(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch risk parameters');
            }

            const data = await response.json();
            console.log('Fetched risk parameters:', data);

            // Update parameters with fetched data
            const updatedParams = parameters.map(param => {
                const isEnabled = data[param.name] === 1;
                const weight = data[`${param.name}_weight`] || 0;

                return {
                    ...param,
                    enabled: isEnabled,
                    weight: weight,
                };
            });

            setParameters(updatedParams);
            setIsUpdateMode(true);
            setSuccessMessage('Loaded existing risk parameters for this project');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);

            // Fetch risk calculation after loading parameters
            await fetchRiskCalculation(projectId);

        } catch (err: any) {
            console.error('Error fetching risk parameters:', err);
            if (err.message !== 'Please log in to continue') {
                // Don't show error for missing parameters, just use create mode
                resetParameters();
                setIsUpdateMode(false);
            }
        } finally {
            setLoadingParameters(false);
        }
    };

    const fetchRiskCalculation = async (projectId: number) => {
        setLoadingRisk(true);

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            if (!token) {
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/risk-parameters/calculate-risk/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                setErrorMessage('Your session has expired. Redirecting to login...');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            if (response.status === 404 || !response.ok) {
                // No risk calculation available yet
                setRiskData(null);
                return;
            }

            const data = await response.json();
            console.log('Risk calculation data:', data);

            setRiskData({
                risk_level: data.risk_level,
                risk_percentage: data.risk_percentage,
                total_risk_score: data.total_risk_score,
                breakdown: data.breakdown || [],
                metadata: data.metadata || {},
            });

        } catch (err: any) {
            console.error('Error fetching risk calculation:', err);
            setRiskData(null);
        } finally {
            setLoadingRisk(false);
        }
    };

    const resetParameters = () => {
        setParameters(prev => prev.map(p => ({ ...p, enabled: false, weight: 0 })));
    };

    const handleToggleParameter = (index: number) => {
        const newParams = [...parameters];
        newParams[index].enabled = !newParams[index].enabled;
        // If disabling, reset weight to 0
        if (!newParams[index].enabled) {
            newParams[index].weight = 0;
        }
        setParameters(newParams);
    };

    const handleWeightChange = (index: number, value: string) => {
        const newParams = [...parameters];
        const numValue = parseInt(value) || 0;
        // Ensure weight is between 0 and 100
        newParams[index].weight = Math.max(0, Math.min(100, numValue));
        setParameters(newParams);
    };

    const fetchRecommendations = async (projectId: number, riskType: string) => {
        console.log('🔍 fetchRecommendations called:', { projectId, riskType });
        setLoadingRecommendations(true);
        setRecommendations([]);
        setShowRecommendations(riskType); // Show modal immediately

        try {
            const authStorage = localStorage.getItem('auth-storage');
            console.log('📦 Auth storage exists:', !!authStorage);

            if (!authStorage) {
                console.error('❌ No auth storage found');
                setErrorMessage('Please log in to view recommendations');
                setShowRecommendations(null);
                return;
            }

            const token = JSON.parse(authStorage).state?.accessToken;
            console.log('🔑 Token exists:', !!token);

            if (!token) {
                console.error('❌ No token found in auth storage');
                setErrorMessage('Authentication required. Please log in again.');
                setShowRecommendations(null);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const url = `${apiUrl}/api/v1/risk-parameters/recommendations/${projectId}?risk_type=${riskType}`;
            console.log('🌐 Fetching from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('📡 Response status:', response.status);

            if (response.status === 401) {
                console.error('❌ Unauthorized - token expired');
                setErrorMessage('Your session has expired. Redirecting to login...');
                setTimeout(() => window.location.href = '/login', 2000);
                setShowRecommendations(null);
                return;
            }

            if (response.status === 404) {
                console.error('❌ Risk parameter not found or not enabled');
                setRecommendations([
                    'This risk parameter is not enabled for the selected project.',
                    'Please configure risk parameters first before viewing recommendations.'
                ]);
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error:', response.status, errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Recommendations data received:', data);
            console.log('📊 Number of recommendations:', data.recommendations?.length || 0);

            if (data.recommendations && data.recommendations.length > 0) {
                setRecommendations(data.recommendations);
                console.log('✅ Recommendations set successfully');
            } else {
                console.warn('⚠️ No recommendations in response');
                setRecommendations([
                    'No specific recommendations available for this risk type at this time.',
                    'Please ensure your project has sufficient data for analysis.'
                ]);
            }

            // Store available developers data if present in response
            if (data.available_developers_data) {
                setAvailableDevelopersData(data.available_developers_data);
                console.log('✅ Available developers data stored:', data.available_developers_data.available_count, 'developers');
            } else {
                setAvailableDevelopersData(null);
            }

        } catch (err: any) {
            console.error('💥 Error fetching recommendations:', err);
            console.error('💥 Error details:', {
                message: err.message,
                stack: err.stack
            });
            setErrorMessage('Failed to load recommendations. Please try again.');
            setRecommendations([
                'Failed to load recommendations due to a technical error.',
                'Please try again or contact support if the problem persists.'
            ]);
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoadingRecommendations(false);
            console.log('🏁 fetchRecommendations completed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProjectId) {
            setErrorMessage('Please select a project');
            return;
        }

        const enabledParams = parameters.filter(p => p.enabled);
        if (enabledParams.length === 0) {
            setErrorMessage('Please enable at least one risk parameter');
            return;
        }

        const totalWeight = enabledParams.reduce((sum, p) => sum + p.weight, 0);
        if (totalWeight === 0) {
            setErrorMessage('Total weight must be greater than 0');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            if (!token) {
                throw new Error('Please log in to continue');
            }

            // Build the request payload based on the schema
            const payload: any = {
                project_id: parseInt(selectedProjectId.toString()),
            };

            // Add each parameter and its weight
            parameters.forEach(param => {
                payload[param.name] = param.enabled ? 1 : 0;
                payload[`${param.name}_weight`] = param.weight;
            });

            console.log('Submitting payload:', payload);
            console.log('Mode:', isUpdateMode ? 'UPDATE' : 'CREATE');

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Use different endpoint based on mode
            const endpoint = isUpdateMode
                ? `${apiUrl}/api/v1/risk-parameters/update`
                : `${apiUrl}/api/v1/risk-parameters/create`;

            const method = isUpdateMode ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${isUpdateMode ? 'update' : 'save'} risk parameters`);
            }

            const result = await response.json();
            const actionText = isUpdateMode ? 'updated' : 'configured';
            setSuccessMessage(`Risk parameters ${actionText} successfully!`);

            // If we just created parameters, switch to update mode
            if (!isUpdateMode) {
                setIsUpdateMode(true);
            }

            // Refresh risk calculation after saving
            await fetchRiskCalculation(Number(selectedProjectId));

            // Reset form after success
            setTimeout(() => {
                setSuccessMessage('');
                if (onSuccess) onSuccess();
            }, 3000);

        } catch (err: any) {
            console.error('Error saving risk parameters:', err);
            setErrorMessage(err.message || 'Failed to save risk parameters');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2.5 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Risk Parameters Configuration</h2>
                        <p className="text-sm text-blue-100 mt-0.5">Configure risk assessment parameters and weights for your project</p>
                    </div>
                </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start animate-fade-in">
                        <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-green-900">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Project Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Project <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        disabled={loadingProjects || !!projectId}
                        required
                    >
                        <option value="">-- Select a project --</option>
                        {projects.map((project) => (
                            <option key={project.project_id} value={project.project_id}>
                                {project.project_name} ({project.key})
                            </option>
                        ))}
                    </select>

                    {/* Loading indicator for parameters */}
                    {loadingParameters && (
                        <div className="mt-3 flex items-center text-sm text-blue-600">
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading risk parameters...
                        </div>
                    )}

                    {/* Mode indicator */}
                    {selectedProjectId && !loadingParameters && (
                        <div className="mt-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isUpdateMode
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {isUpdateMode ? (
                                    <>
                                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Update Mode - Existing Configuration Found
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Mode - New Configuration
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Risk Status Display */}
                {selectedProjectId && riskData && !loadingRisk && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-6">
                            {/* Risk Status Box */}
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Current Risk Status
                                </h3>

                                <div className={`inline-flex items-center px-6 py-4 rounded-lg shadow-md font-bold text-lg transition-all ${riskData.risk_level === 'LOW'
                                    ? 'bg-green-500 text-white'
                                    : riskData.risk_level === 'MEDIUM'
                                        ? 'bg-yellow-500 text-white'
                                        : riskData.risk_level === 'HIGH'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-red-600 text-white'
                                    }`}>
                                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <div className="text-2xl font-extrabold">{riskData.risk_level}</div>
                                        <div className="text-sm font-normal opacity-90">{riskData.risk_percentage.toFixed(1)}% Risk</div>
                                    </div>
                                </div>

                                {/* Collapsible Risk Parameters Breakdown */}
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
                                        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        <svg
                                            className={`w-4 h-4 mr-2 transition-transform ${showRiskBreakdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        {showRiskBreakdown ? 'Hide' : 'View'} Risk Parameters Breakdown
                                    </button>

                                    {/* Breakdown Details */}
                                    {showRiskBreakdown && riskData.breakdown && riskData.breakdown.length > 0 && (
                                        <div className="mt-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-fade-in">
                                            {/* Visualization Type Selector */}
                                            <div className="mb-4 pb-3 border-b border-gray-200">
                                                <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Visualization Type</h4>
                                                <div className="flex flex-wrap gap-4">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="visualizationType"
                                                            value="list"
                                                            checked={visualizationType === 'list'}
                                                            onChange={(e) => setVisualizationType(e.target.value as any)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">List View</span>
                                                    </label>
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="visualizationType"
                                                            value="pie"
                                                            checked={visualizationType === 'pie'}
                                                            onChange={(e) => setVisualizationType(e.target.value as any)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">Pie Chart</span>
                                                    </label>
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="visualizationType"
                                                            value="bar"
                                                            checked={visualizationType === 'bar'}
                                                            onChange={(e) => setVisualizationType(e.target.value as any)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">Bar Chart</span>
                                                    </label>
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="visualizationType"
                                                            value="line"
                                                            checked={visualizationType === 'line'}
                                                            onChange={(e) => setVisualizationType(e.target.value as any)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">Line Chart</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* List View */}
                                            {visualizationType === 'list' && (
                                                <div className="space-y-2 relative">
                                                    {riskData.breakdown
                                                        .filter((item: any) => item.enabled)
                                                        .map((item: any, index: number) => (
                                                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                                                <div className="flex-1">
                                                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                                                        {item.parameter.replace(/_/g, ' ')}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 ml-2">
                                                                        (Weight: {item.weight})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-sm text-gray-600">
                                                                        {((item.contribution || 0) * 100).toFixed(1)}%
                                                                    </div>
                                                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${((item.contribution || 0) * 100) < 25
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : ((item.contribution || 0) * 100) < 50
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : ((item.contribution || 0) * 100) < 75
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {((item.contribution || 0) * 100) < 25 ? 'LOW'
                                                                            : ((item.contribution || 0) * 100) < 50 ? 'MEDIUM'
                                                                                : ((item.contribution || 0) * 100) < 75 ? 'HIGH'
                                                                                    : 'CRITICAL'}
                                                                    </div>

                                                                    {/* Insights Icon for detected_bugs */}
                                                                    {item.parameter === 'detected_bugs' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View bug insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for detected_bugs */}
                                                                    {item.parameter === 'detected_bugs' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'detected_bugs')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for uncompleted_tasks */}
                                                                    {item.parameter === 'uncompleted_tasks' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View task insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for uncompleted_tasks */}
                                                                    {item.parameter === 'uncompleted_tasks' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'uncompleted_tasks')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for blockers_count */}
                                                                    {item.parameter === 'blockers_count' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View blocker insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for blockers_count */}
                                                                    {item.parameter === 'blockers_count' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'blockers_count')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for timeline_conflict */}
                                                                    {item.parameter === 'timeline_conflict' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View timeline conflict insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for timeline_conflict */}
                                                                    {item.parameter === 'timeline_conflict' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'timeline_conflict')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for developer_availability */}
                                                                    {item.parameter === 'developer_availability' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View developer availability insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for developer_availability */}
                                                                    {item.parameter === 'developer_availability' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'developer_availability')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for task_progress */}
                                                                    {item.parameter === 'task_progress' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View task progress insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for task_progress */}
                                                                    {item.parameter === 'task_progress' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'task_progress')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Insights Icon for sprint_completion_level */}
                                                                    {item.parameter === 'sprint_completion_level' && riskData.metadata && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowInsights(showInsights === item.parameter ? null : item.parameter)}
                                                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                                            title="View sprint completion insights"
                                                                        >
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}

                                                                    {/* Recommendations Icon for sprint_completion_level */}
                                                                    {item.parameter === 'sprint_completion_level' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fetchRecommendations(Number(selectedProjectId), 'sprint_completion_level')}
                                                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                                                            title="View Recommendations"
                                                                        >
                                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Bug Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'detected_bugs' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 z-50 animate-fade-in">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                Bug Details
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Bugs */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Bugs</div>
                                                                                <div className="text-2xl font-bold text-gray-900">{riskData.metadata.total_bugs || 0}</div>
                                                                            </div>

                                                                            {/* Priority Breakdown */}
                                                                            <div className="space-y-2">
                                                                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Priority Breakdown</div>

                                                                                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                                                                        High Priority
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-red-700">{riskData.metadata.high_priority_bugs || 0}</span>
                                                                                        {riskData.metadata.high_priority_bugs_risk > 0 && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-600 text-white">
                                                                                                {riskData.metadata.high_priority_bugs_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                                                                        Medium Priority
                                                                                    </span>
                                                                                    <span className="font-bold text-yellow-700">{riskData.metadata.medium_priority_bugs || 0}</span>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                        Low Priority
                                                                                    </span>
                                                                                    <span className="font-bold text-green-700">{riskData.metadata.low_priority_bugs || 0}</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Status Breakdown */}
                                                                            <div className="space-y-2">
                                                                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status Breakdown</div>

                                                                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                                                                        To-Do Bugs
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-blue-700">{riskData.metadata.todo_bugs || 0}</span>
                                                                                        {riskData.metadata.todo_bugs_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.todo_bugs_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.todo_bugs_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.todo_bugs_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                                                                        In-Progress Bugs
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-yellow-700">{riskData.metadata.inprogress_bugs || 0}</span>
                                                                                        {riskData.metadata.inprogress_bugs_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.inprogress_bugs_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.inprogress_bugs_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.inprogress_bugs_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                        Completed Bugs
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-green-700">{riskData.metadata.completed_bugs || 0}</span>
                                                                                        {riskData.metadata.completed_bugs_risk !== undefined && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                                {riskData.metadata.completed_bugs_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Blocker Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'blockers_count' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-orange-200 p-4 z-50 animate-fade-in">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                </svg>
                                                                                Blocker Details
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Blockers */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Blockers</div>
                                                                                <div className="text-2xl font-bold text-gray-900">{riskData.metadata.total_blockers || 0}</div>
                                                                            </div>

                                                                            {/* Severity Breakdown */}
                                                                            <div className="space-y-2">
                                                                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Severity Breakdown</div>

                                                                                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                                                                                        Critical
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-red-700">{riskData.metadata.critical_blockers || 0}</span>
                                                                                        {riskData.metadata.critical_blockers_risk !== undefined && riskData.metadata.critical_blockers_risk > 0 && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-600 text-white">
                                                                                                {riskData.metadata.critical_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                                                                        High
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-orange-700">{riskData.metadata.high_blockers || 0}</span>
                                                                                        {riskData.metadata.high_blockers_risk !== undefined && riskData.metadata.high_blockers_risk > 0 && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500 text-white">
                                                                                                {riskData.metadata.high_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                                                                        Medium
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-yellow-700">{riskData.metadata.medium_blockers || 0}</span>
                                                                                        {riskData.metadata.medium_blockers_risk !== undefined && riskData.metadata.medium_blockers_risk > 0 && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-500 text-white">
                                                                                                {riskData.metadata.medium_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                        Low
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-green-700">{riskData.metadata.low_blockers || 0}</span>
                                                                                        {riskData.metadata.low_blockers_risk !== undefined && riskData.metadata.low_blockers_risk > 0 && (
                                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500 text-white">
                                                                                                {riskData.metadata.low_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Status Breakdown */}
                                                                            <div className="space-y-2">
                                                                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status Breakdown</div>

                                                                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                                                                        Open
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-blue-700">{riskData.metadata.open_blockers || 0}</span>
                                                                                        {riskData.metadata.open_blockers_risk !== undefined && riskData.metadata.open_blockers_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.open_blockers_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.open_blockers_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.open_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                                                                        In Progress
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-yellow-700">{riskData.metadata.inprogress_blockers || 0}</span>
                                                                                        {riskData.metadata.inprogress_blockers_risk !== undefined && riskData.metadata.inprogress_blockers_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.inprogress_blockers_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.inprogress_blockers_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.inprogress_blockers_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                        Resolved
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-green-700">{riskData.metadata.resolved_blockers || 0}</span>
                                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                            0%
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Task Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'uncompleted_tasks' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 z-50 animate-fade-in">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                                </svg>
                                                                                Task Details
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Uncompleted Tasks */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Uncompleted Tasks</div>
                                                                                <div className="text-2xl font-bold text-gray-900">
                                                                                    {(riskData.metadata.todo_tasks || 0) + (riskData.metadata.inprogress_tasks || 0)}
                                                                                </div>
                                                                            </div>

                                                                            {/* Status Breakdown */}
                                                                            <div className="space-y-2">
                                                                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status Breakdown</div>

                                                                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                                                                        To-Do Tasks
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-blue-700">{riskData.metadata.todo_tasks || 0}</span>
                                                                                        {riskData.metadata.todo_tasks_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.todo_tasks_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.todo_tasks_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.todo_tasks_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                                                                        In-Progress Tasks
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-yellow-700">{riskData.metadata.inprogress_tasks || 0}</span>
                                                                                        {riskData.metadata.inprogress_tasks_risk > 0 && (
                                                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskData.metadata.inprogress_tasks_risk >= 70 ? 'bg-red-100 text-red-700' :
                                                                                                riskData.metadata.inprogress_tasks_risk >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                                                    'bg-green-100 text-green-700'
                                                                                                }`}>
                                                                                                {riskData.metadata.inprogress_tasks_risk}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                        Completed Tasks
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-green-700">{riskData.metadata.completed_tasks_only || 0}</span>
                                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                                                            0%
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Overdue Tasks Warning */}
                                                                                {(riskData.metadata.overdue_tasks || 0) > 0 && (
                                                                                    <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                                                                                        <span className="text-sm font-medium text-gray-700 flex items-center">
                                                                                            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                            Overdue Tasks
                                                                                        </span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="font-bold text-red-700">{riskData.metadata.overdue_tasks}</span>
                                                                                            {riskData.metadata.overdue_tasks_risk > 0 && (
                                                                                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-600 text-white">
                                                                                                    {riskData.metadata.overdue_tasks_risk}%
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Risk Notice */}
                                                                            {(riskData.metadata.overdue_tasks || 0) > 0 && (
                                                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                                                    <div className="flex items-start">
                                                                                        <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                        </svg>
                                                                                        <div>
                                                                                            <p className="text-xs font-semibold text-red-900 mb-1">High Risk - Overdue Tasks</p>
                                                                                            <p className="text-xs text-red-700">
                                                                                                {riskData.metadata.overdue_tasks} task{riskData.metadata.overdue_tasks > 1 ? 's' : ''} past their end date.
                                                                                                {riskData.metadata.max_overdue_days > 0 && (
                                                                                                    <span className="font-semibold">
                                                                                                        {' '}Maximum overdue: {riskData.metadata.max_overdue_days} day{riskData.metadata.max_overdue_days > 1 ? 's' : ''}.
                                                                                                    </span>
                                                                                                )}
                                                                                            </p>
                                                                                            <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Requires immediate attention</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Developer Breakdown */}
                                                                            {console.log('🔍 Developer Breakdown Check:', {
                                                                                exists: !!riskData?.metadata?.developer_breakdown,
                                                                                data: riskData?.metadata?.developer_breakdown,
                                                                                totalDevs: riskData?.metadata?.developer_breakdown?.total_developers
                                                                            })}
                                                                            {riskData.metadata.developer_breakdown && (
                                                                                <div className="mt-4 space-y-2">
                                                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                                                                                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                        </svg>
                                                                                        Developer-wise Task Distribution
                                                                                    </div>

                                                                                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                            <div>
                                                                                                <span className="text-gray-600">Developers:</span>
                                                                                                <span className="font-bold text-gray-900 ml-1">{riskData.metadata.developer_breakdown.total_developers}</span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-gray-600">Avg Tasks:</span>
                                                                                                <span className="font-bold text-gray-900 ml-1">{riskData.metadata.developer_breakdown.average_tasks_per_developer} per dev</span>
                                                                                            </div>
                                                                                            {riskData.metadata.developer_breakdown.unassigned_tasks > 0 && (
                                                                                                <div className="col-span-2">
                                                                                                    <span className="text-orange-600 font-semibold">📦 {riskData.metadata.developer_breakdown.unassigned_tasks} unassigned tasks</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                                        {riskData.metadata.developer_breakdown.developers.map((dev: any, idx: number) => (
                                                                                            <div key={idx} className={`p-3 rounded-lg border ${dev.is_overloaded ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                                                                                                <div className="flex items-center justify-between mb-2">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {dev.is_overloaded && (
                                                                                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                                            </svg>
                                                                                                        )}
                                                                                                        <span className="text-sm font-bold text-gray-900">{dev.name}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-xs text-gray-600">Risk:</span>
                                                                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${dev.risk_percentage >= 70 ? 'bg-red-600 text-white' :
                                                                                                            dev.risk_percentage >= 40 ? 'bg-orange-100 text-orange-700' :
                                                                                                                'bg-green-100 text-green-700'
                                                                                                            }`}>
                                                                                                            {dev.risk_percentage}%
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                                                                                                    <div className="bg-gray-100 p-2 rounded text-center">
                                                                                                        <div className="text-gray-600">Total</div>
                                                                                                        <div className="text-lg font-bold text-gray-900">{dev.total_tasks}</div>
                                                                                                    </div>
                                                                                                    <div className="bg-blue-50 p-2 rounded text-center">
                                                                                                        <div className="text-gray-600">To-Do</div>
                                                                                                        <div className="text-lg font-bold text-blue-700">{dev.todo}</div>
                                                                                                    </div>
                                                                                                    <div className="bg-yellow-50 p-2 rounded text-center">
                                                                                                        <div className="text-gray-600">In Prog.</div>
                                                                                                        <div className="text-lg font-bold text-yellow-700">{dev.inprogress}</div>
                                                                                                    </div>
                                                                                                    <div className="bg-green-50 p-2 rounded text-center">
                                                                                                        <div className="text-gray-600">Done</div>
                                                                                                        <div className="text-lg font-bold text-green-700">{dev.completed}</div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center justify-between text-xs">
                                                                                                    <span className="text-gray-600">
                                                                                                        Workload: <span className="font-semibold text-gray-900">{dev.workload_percentage}% of project</span>
                                                                                                    </span>
                                                                                                    {dev.is_overloaded && (
                                                                                                        <span className="text-red-600 font-semibold">⚠️ Overloaded</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Timeline Conflict Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'timeline_conflict' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border-2 border-purple-200 p-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                                Timeline Conflict Details
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Conflicts */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Conflicts Detected</div>
                                                                                <div className="text-2xl font-bold text-gray-900">
                                                                                    {riskData.metadata.timeline_conflicts?.length || 0}
                                                                                </div>
                                                                            </div>

                                                                            {/* Conflict List */}
                                                                            {riskData.metadata.timeline_conflicts && riskData.metadata.timeline_conflicts.length > 0 ? (
                                                                                <div className="space-y-2">
                                                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Conflicting Tasks</div>

                                                                                    {riskData.metadata.timeline_conflicts.map((conflict: any, idx: number) => (
                                                                                        <div key={idx} className={`p-3 rounded-lg border-2 ${conflict.risk_value >= 70 ? 'bg-red-50 border-red-300' :
                                                                                            conflict.risk_value >= 40 ? 'bg-yellow-50 border-yellow-300' :
                                                                                                'bg-blue-50 border-blue-300'
                                                                                            }`}>
                                                                                            {/* Developer Name */}
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                                    </svg>
                                                                                                    <span className="font-bold text-gray-900 text-sm">{conflict.developer_name}</span>
                                                                                                </div>
                                                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${conflict.risk_value >= 70 ? 'bg-red-600 text-white' :
                                                                                                    conflict.risk_value >= 40 ? 'bg-yellow-600 text-white' :
                                                                                                        'bg-blue-600 text-white'
                                                                                                    }`}>
                                                                                                    {conflict.risk_value}% Risk
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Conflicting Tasks */}
                                                                                            <div className="space-y-2 text-xs">
                                                                                                <div className="bg-white bg-opacity-50 p-2 rounded">
                                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                                        <div className="font-semibold text-gray-700">📋 Task 1:</div>
                                                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${conflict.task1_priority?.toLowerCase() === 'critical' ? 'bg-red-600 text-white' :
                                                                                                            conflict.task1_priority?.toLowerCase() === 'high' ? 'bg-orange-500 text-white' :
                                                                                                                conflict.task1_priority?.toLowerCase() === 'medium' ? 'bg-yellow-500 text-white' :
                                                                                                                    'bg-green-500 text-white'
                                                                                                            }`}>
                                                                                                            {conflict.task1_priority || 'N/A'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="text-gray-900">{conflict.task1_name}</div>
                                                                                                </div>
                                                                                                <div className="bg-white bg-opacity-50 p-2 rounded">
                                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                                        <div className="font-semibold text-gray-700">📋 Task 2:</div>
                                                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${conflict.task2_priority?.toLowerCase() === 'critical' ? 'bg-red-600 text-white' :
                                                                                                            conflict.task2_priority?.toLowerCase() === 'high' ? 'bg-orange-500 text-white' :
                                                                                                                conflict.task2_priority?.toLowerCase() === 'medium' ? 'bg-yellow-500 text-white' :
                                                                                                                    'bg-green-500 text-white'
                                                                                                            }`}>
                                                                                                            {conflict.task2_priority || 'N/A'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="text-gray-900">{conflict.task2_name}</div>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Overlap Period */}
                                                                                            <div className="mt-2 p-2 bg-white bg-opacity-70 rounded">
                                                                                                <div className="text-xs font-semibold text-gray-700 mb-1">⏱️ Overlap Period:</div>
                                                                                                <div className="flex items-center justify-between text-xs text-gray-900">
                                                                                                    <span>{new Date(conflict.overlap_start).toLocaleDateString()}</span>
                                                                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                                                    </svg>
                                                                                                    <span>{new Date(conflict.overlap_end).toLocaleDateString()}</span>
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-600 mt-1 text-center">
                                                                                                    ({conflict.overlap_days} day{conflict.overlap_days > 1 ? 's' : ''} overlap)
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                                                                    <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    <p className="text-sm font-semibold text-green-900">No Timeline Conflicts</p>
                                                                                    <p className="text-xs text-green-700 mt-1">All tasks are properly scheduled</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Developer Availability Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'developer_availability' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border-2 border-teal-200 p-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                                                </svg>
                                                                                Developer Availability
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Leave Hours */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Leave Hours</div>
                                                                                <div className="text-2xl font-bold text-gray-900">
                                                                                    {riskData.metadata.total_leave_hours || 0} hrs
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    Out of {riskData.metadata.total_sprint_hours || 0} sprint hours
                                                                                </div>
                                                                            </div>

                                                                            {/* Developer Breakdown */}
                                                                            {riskData.metadata.developer_availability_breakdown && riskData.metadata.developer_availability_breakdown.length > 0 ? (
                                                                                <div className="space-y-2">
                                                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Developer Leave Breakdown</div>

                                                                                    {riskData.metadata.developer_availability_breakdown.map((dev: any, idx: number) => (
                                                                                        <div key={idx} className={`p-3 rounded-lg border-2 ${dev.risk_percentage >= 20 ? 'bg-red-50 border-red-300' :
                                                                                            dev.risk_percentage >= 10 ? 'bg-yellow-50 border-yellow-300' :
                                                                                                'bg-green-50 border-green-300'
                                                                                            }`}>
                                                                                            {/* Developer Info */}
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                                    </svg>
                                                                                                    <span className="font-bold text-gray-900 text-sm">{dev.developer_name}</span>
                                                                                                </div>
                                                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${dev.risk_percentage >= 20 ? 'bg-red-600 text-white' :
                                                                                                    dev.risk_percentage >= 10 ? 'bg-yellow-600 text-white' :
                                                                                                        'bg-green-600 text-white'
                                                                                                    }`}>
                                                                                                    {dev.risk_percentage}% Risk
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Leave Stats */}
                                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                                <div className="bg-white bg-opacity-60 p-2 rounded">
                                                                                                    <div className="text-gray-600 mb-1">Leave Hours</div>
                                                                                                    <div className="text-lg font-bold text-gray-900">{dev.leave_hours} hrs</div>
                                                                                                </div>
                                                                                                <div className="bg-white bg-opacity-60 p-2 rounded">
                                                                                                    <div className="text-gray-600 mb-1">Leave Instances</div>
                                                                                                    <div className="text-lg font-bold text-gray-900">{dev.leave_count}</div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                                                                    <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    <p className="text-sm font-semibold text-green-900">Full Availability</p>
                                                                                    <p className="text-xs text-green-700 mt-1">No leaves scheduled</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Task Progress Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'task_progress' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border-2 border-indigo-200 p-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                                </svg>
                                                                                Task Progress Details
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Average Completion Rate */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Average Completion Rate</div>
                                                                                <div className="text-2xl font-bold text-gray-900">
                                                                                    {((riskData.metadata.avg_completion_rate || 0) * 100).toFixed(1)}%
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    Across {riskData.metadata.sprint_progress_breakdown?.length || 0} sprints
                                                                                </div>
                                                                            </div>

                                                                            {/* Sprint Breakdown */}
                                                                            {riskData.metadata.sprint_progress_breakdown && riskData.metadata.sprint_progress_breakdown.length > 0 ? (
                                                                                <div className="space-y-2">
                                                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sprint Completion Breakdown</div>

                                                                                    {riskData.metadata.sprint_progress_breakdown.map((sprint: any, idx: number) => (
                                                                                        <div key={idx} className={`p-3 rounded-lg border-2 ${sprint.is_overdue ? 'bg-red-50 border-red-300' :
                                                                                            sprint.completion_percentage >= 80 ? 'bg-green-50 border-green-300' :
                                                                                                sprint.completion_percentage >= 60 ? 'bg-yellow-50 border-yellow-300' :
                                                                                                    'bg-red-50 border-red-300'
                                                                                            }`}>
                                                                                            {/* Sprint Name & Status */}
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                                                    </svg>
                                                                                                    <span className="font-bold text-gray-900 text-sm">{sprint.sprint_name}</span>
                                                                                                </div>
                                                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${sprint.is_overdue ? 'bg-red-600 text-white' :
                                                                                                    sprint.completion_percentage >= 80 ? 'bg-green-600 text-white' :
                                                                                                        sprint.completion_percentage >= 60 ? 'bg-yellow-600 text-white' :
                                                                                                            'bg-red-600 text-white'
                                                                                                    }`}>
                                                                                                    {sprint.completion_percentage}%
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Sprint Status Badge */}
                                                                                            <div className="mb-2 flex items-center gap-2">
                                                                                                <span className={`text-xs px-2 py-1 rounded ${sprint.sprint_status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                                                                                    sprint.sprint_status === 'In Progress' ? 'bg-purple-100 text-purple-700' :
                                                                                                        'bg-gray-100 text-gray-700'
                                                                                                    }`}>
                                                                                                    {sprint.sprint_status}
                                                                                                </span>
                                                                                                {sprint.is_overdue && (
                                                                                                    <span className="text-xs px-2 py-1 rounded bg-red-600 text-white font-bold flex items-center gap-1">
                                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                                        </svg>
                                                                                                        OVERDUE
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Overdue Risk Details */}
                                                                                            {sprint.is_overdue && (
                                                                                                <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded">
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <div className="text-xs text-red-900">
                                                                                                            <span className="font-bold">{sprint.days_overdue} days</span> overdue
                                                                                                        </div>
                                                                                                        <div className="text-xs font-bold text-red-900">
                                                                                                            Risk: {sprint.overdue_risk_value}%
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Hours Stats */}
                                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                                <div className="bg-white bg-opacity-60 p-2 rounded">
                                                                                                    <div className="text-gray-600 mb-1">Estimated</div>
                                                                                                    <div className="text-lg font-bold text-gray-900">{sprint.estimated_hours} hrs</div>
                                                                                                </div>
                                                                                                <div className="bg-white bg-opacity-60 p-2 rounded">
                                                                                                    <div className="text-gray-600 mb-1">Completed</div>
                                                                                                    <div className="text-lg font-bold text-gray-900">{sprint.completed_hours} hrs</div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                                                                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    <p className="text-sm font-semibold text-blue-900">No Sprint Data</p>
                                                                                    <p className="text-xs text-blue-700 mt-1">No sprints with estimated hours</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Sprint Completion Level Insights Modal */}
                                                                {showInsights === item.parameter && item.parameter === 'sprint_completion_level' && riskData.metadata && (
                                                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border-2 border-cyan-200 p-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-bold text-gray-900 flex items-center">
                                                                                <svg className="w-5 h-5 mr-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                                                </svg>
                                                                                Sprint Completion Status
                                                                            </h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowInsights(null)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Total Sprints */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 mb-1">Total Sprints</div>
                                                                                <div className="text-2xl font-bold text-gray-900">
                                                                                    {riskData.metadata.total_sprints || 0}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    {riskData.metadata.completed_sprints || 0} completed
                                                                                </div>
                                                                            </div>

                                                                            {/* Sprint Status Breakdown */}
                                                                            {riskData.metadata.sprint_completion_breakdown && Object.keys(riskData.metadata.sprint_completion_breakdown).length > 0 ? (
                                                                                <div className="space-y-2">
                                                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sprint Status Breakdown</div>

                                                                                    {/* Completed Sprints */}
                                                                                    <div className="p-3 rounded-lg border-2 bg-green-50 border-green-300">
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                                </svg>
                                                                                                <span className="font-bold text-gray-900 text-sm">Completed</span>
                                                                                            </div>
                                                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-green-600 text-white">
                                                                                                {riskData.metadata.sprint_completion_breakdown.completed_percentage || 0}%
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Count</div>
                                                                                                <div className="text-lg font-bold text-gray-900">{riskData.metadata.sprint_completion_breakdown.completed || 0} sprints</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Risk</div>
                                                                                                <div className="text-lg font-bold text-green-600">{riskData.metadata.sprint_completion_breakdown.completed_risk || 0}%</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* In Progress Sprints */}
                                                                                    <div className="p-3 rounded-lg border-2 bg-yellow-50 border-yellow-300">
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                                </svg>
                                                                                                <span className="font-bold text-gray-900 text-sm">In Progress</span>
                                                                                            </div>
                                                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-600 text-white">
                                                                                                {riskData.metadata.sprint_completion_breakdown.in_progress_percentage || 0}%
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Count</div>
                                                                                                <div className="text-lg font-bold text-gray-900">{riskData.metadata.sprint_completion_breakdown.in_progress || 0} sprints</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Risk</div>
                                                                                                <div className="text-lg font-bold text-yellow-600">{riskData.metadata.sprint_completion_breakdown.in_progress_risk || 0}%</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* To Do Sprints */}
                                                                                    <div className="p-3 rounded-lg border-2 bg-blue-50 border-blue-300">
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                                                </svg>
                                                                                                <span className="font-bold text-gray-900 text-sm">To Do</span>
                                                                                            </div>
                                                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-600 text-white">
                                                                                                {riskData.metadata.sprint_completion_breakdown.to_do_percentage || 0}%
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Count</div>
                                                                                                <div className="text-lg font-bold text-gray-900">{riskData.metadata.sprint_completion_breakdown.to_do || 0} sprints</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="text-gray-600 mb-1">Risk</div>
                                                                                                <div className="text-lg font-bold text-red-600">{riskData.metadata.sprint_completion_breakdown.to_do_risk || 0}%</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                                                                    <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    <p className="text-sm font-semibold text-blue-900">No Sprint Data</p>
                                                                                    <p className="text-xs text-blue-700 mt-1">No sprints in this project</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            )}

                                            {/* Chart Views */}
                                            {(visualizationType === 'pie' || visualizationType === 'bar' || visualizationType === 'line') && (
                                                <RiskChartView
                                                    data={riskData.breakdown.filter((item: any) => item.enabled)}
                                                    type={visualizationType}
                                                />
                                            )}

                                            {/* Total Summary at Bottom */}
                                            <div className="mt-3 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-900">Total Project Risk</span>
                                                <span className="text-lg font-bold text-gray-900">{riskData.risk_percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Risk Level Legend with Percentages */}
                            <div className="flex-shrink-0">
                                <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Risk Level Guide</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-6 h-6 bg-green-500 rounded shadow-sm flex-shrink-0"></div>
                                        <div>
                                            <div className="text-gray-700 font-medium">Low Risk</div>
                                            <div className="text-xs text-gray-500">0-25%</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-6 h-6 bg-yellow-500 rounded shadow-sm flex-shrink-0"></div>
                                        <div>
                                            <div className="text-gray-700 font-medium">Medium Risk</div>
                                            <div className="text-xs text-gray-500">25-50%</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-6 h-6 bg-orange-500 rounded shadow-sm flex-shrink-0"></div>
                                        <div>
                                            <div className="text-gray-700 font-medium">High Risk</div>
                                            <div className="text-xs text-gray-500">50-75%</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-6 h-6 bg-red-600 rounded shadow-sm flex-shrink-0"></div>
                                        <div>
                                            <div className="text-gray-700 font-medium">Critical Risk</div>
                                            <div className="text-xs text-gray-500">75-100%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Risk Indicator */}
                {selectedProjectId && loadingRisk && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Calculating risk level...</span>
                    </div>
                )}

                {/* Parameters Grid */}
                <div>
                    {/* Collapsible Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => setShowParametersConfig(!showParametersConfig)}
                            className="flex items-center text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                        >
                            <svg
                                className={`w-5 h-5 mr-2 transition-transform ${showParametersConfig ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Configure Risk Parameters
                        </button>
                        <span className="text-sm text-gray-500">
                            {parameters.filter(p => p.enabled).length} of {parameters.length} enabled
                        </span>
                    </div>

                    {/* Collapsible Parameters List */}
                    {showParametersConfig && (
                        <div className="space-y-3 animate-fade-in">
                            {parameters.map((param, index) => (
                                <div
                                    key={param.name}
                                    className={`border rounded-lg p-4 transition-all ${param.enabled
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-gray-200 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Toggle Switch */}
                                        <div className="flex items-center pt-1">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={param.enabled}
                                                    onChange={() => handleToggleParameter(index)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {/* Parameter Info */}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{param.label}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                                        </div>

                                        {/* Weight Input */}
                                        <div className="w-32">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Weight (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={param.weight}
                                                onChange={(e) => handleWeightChange(index, e.target.value)}
                                                disabled={!param.enabled}
                                                className={`w-full px-3 py-2 border rounded-lg text-center font-semibold transition-all ${param.enabled
                                                    ? 'border-blue-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total Weight Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Weight</span>
                        <span className="text-2xl font-bold text-gray-900">
                            {parameters.reduce((sum, p) => sum + (p.enabled ? p.weight : 0), 0)}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        The total weight represents the combined importance of all enabled parameters
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            isUpdateMode ? 'Update Configuration' : 'Save Configuration'
                        )}
                    </button>
                </div>
            </form>

            {/* Recommendations Modal - Full Screen Overlay */}
            {showRecommendations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-2.5 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Risk Remediation Recommendations</h2>
                                    <p className="text-sm text-blue-100 mt-0.5">
                                        Actionable steps to reduce {showRecommendations.replace(/_/g, ' ')} risk
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRecommendations(null);
                                    setRecommendations([]);
                                }}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Loading State */}
                            {loadingRecommendations && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-lg font-semibold text-gray-700 mb-2">Generating Recommendations...</p>
                                    <p className="text-sm text-gray-500">Analyzing your project data</p>
                                </div>
                            )}

                            {/* Recommendations Content */}
                            {!loadingRecommendations && (
                                <>
                                    {/* Info Banner */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <h3 className="font-semibold text-blue-900 mb-1">AI-Generated Recommendations</h3>
                                                <p className="text-sm text-blue-800">
                                                    These recommendations are based on your current project data and risk metrics.
                                                    Apply the suggestions that best fit your team's context and Agile practices.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendations List */}
                                    <div className="space-y-4">
                                        {recommendations.map((recommendation, index) => {
                                            // Check if recommendation mentions developer assignment (keywords)
                                            const developerKeywords = [
                                                'assign', 'reassign', 'redistribute', 'rebalance',
                                                'developer', 'workload', 'available', 'lighter load',
                                                'team member', 'overload'
                                            ];

                                            const mentionsDeveloperAssignment = developerKeywords.some(keyword =>
                                                recommendation.toLowerCase().includes(keyword.toLowerCase())
                                            );

                                            // Check if this is the old marker format (backwards compatibility)
                                            const isAvailableDevsRec = recommendation.startsWith('[AVAILABLE_DEVELOPERS]');
                                            const cleanRecommendation = isAvailableDevsRec
                                                ? recommendation.replace('[AVAILABLE_DEVELOPERS]', '').trim()
                                                : recommendation;

                                            // Show button if: marker exists OR mentions developer assignment AND we have developer data
                                            const showDevelopersButton = (isAvailableDevsRec || mentionsDeveloperAssignment) && availableDevelopersData;

                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Number Badge */}
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${showDevelopersButton
                                                                ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                                                                : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                                                                }`}>
                                                                {showDevelopersButton ? (
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    index + 1
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Recommendation Text */}
                                                        <div className="flex-1">
                                                            <p className="text-gray-800 leading-relaxed">
                                                                {cleanRecommendation}
                                                            </p>

                                                            {/* View Developers Button - Shows when recommendation mentions developer assignment */}
                                                            {showDevelopersButton && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setShowRecommendations(null); // Close recommendations modal
                                                                        setShowAvailableDevelopers(true); // Open developers list
                                                                    }}
                                                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md text-sm font-semibold"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                    View Available Developers ({availableDevelopersData.available_count})
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Action Icon */}
                                                        <div className="flex-shrink-0">
                                                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Summary */}
                                    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-semibold">
                                                {recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''} generated
                                            </span>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-gray-600">
                                                Based on current project metrics
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">
                                💡 Tip: Discuss these recommendations in your next team meeting
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRecommendations(null);
                                    setRecommendations([]);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Developers List Modal */}
            {showAvailableDevelopers && availableDevelopersData && (
                <AvailableDevelopersList
                    developers={availableDevelopersData.available_developers}
                    sprintName={availableDevelopersData.sprint_info?.sprint_name}
                    onClose={() => setShowAvailableDevelopers(false)}
                />
            )}
        </div>
    );
}
