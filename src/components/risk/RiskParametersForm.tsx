'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

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
    const [showParametersConfig, setShowParametersConfig] = useState(true);
    const [visualizationType, setVisualizationType] = useState<'list' | 'pie' | 'bar' | 'line'>('list');
    const [showInsights, setShowInsights] = useState<string | null>(null);

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
            name: 'developer_workload',
            label: 'Developer Workload',
            description: 'Current workload distribution among developers',
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
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            if (!token) {
                setErrorMessage('Please log in to view projects');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/projects/?page=1&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            setProjects(data.data || []);
        } catch (err: any) {
            console.error('Error fetching projects:', err);
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
                throw new Error('Please log in to continue');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/risk-parameters/get/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

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
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5">
                <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2.5 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Risk Parameters Configuration</h2>
                        <p className="text-sm text-red-100 mt-0.5">Configure risk assessment parameters and weights for your project</p>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
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
                                                                        {((item.risk_score || 0) * 100).toFixed(1)}%
                                                                    </div>
                                                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${(item.risk_score || 0) < 0.25
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : (item.risk_score || 0) < 0.50
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : (item.risk_score || 0) < 0.75
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {(item.risk_score || 0) < 0.25 ? 'LOW'
                                                                            : (item.risk_score || 0) < 0.50 ? 'MEDIUM'
                                                                                : (item.risk_score || 0) < 0.75 ? 'HIGH'
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
                                                                </div>

                                                                {/* Insights Modal */}
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
                                                                                    <span className="font-bold text-red-700">1</span>
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
                                        ? 'border-red-300 bg-red-50'
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
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
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
                                                    ? 'border-red-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500'
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
                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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
        </div>
    );
}
