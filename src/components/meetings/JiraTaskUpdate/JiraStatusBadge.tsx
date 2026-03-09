import React, { useState, useEffect } from 'react';
import { jiraApi } from '@/lib/api/jira.api';

interface JiraStatusBadgeProps {
    ticketId: string;
}

export default function JiraStatusBadge({ ticketId }: JiraStatusBadgeProps) {
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchStatus = async () => {
            if (!ticketId) return;

            setLoading(true);
            try {
                const response = await jiraApi.getIssueStatus(ticketId);
                if (mounted && response.success && response.data) {
                    setStatusData(response.data);
                } else if (mounted) {
                    setError(true);
                }
            } catch (err) {
                if (mounted) {
                    console.error(`Failed to fetch status for ${ticketId}`, err);
                    setError(true);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStatus();

        return () => {
            mounted = false;
        };
    }, [ticketId]);

    if (loading) {
        return (
            <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
        );
    }

    if (error || !statusData) {
        return null;
    }

    const statusName = statusData.status || 'Unknown';
    const category = (statusData.status_category || '').toLowerCase();
    const name = statusName.toLowerCase();

    // Determine color styles based on category/name
    let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';

    if (category === 'done' || name === 'done' || name === 'completed') {
        colorClass = 'bg-green-50 text-green-700 border-green-200';
    } else if (category === 'in progress' || name === 'in progress') {
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (category === 'to do' || name === 'to do') {
        colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
    }

    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
            title={`Jira Status: ${statusName}`}
        >
            🎫 {statusName}
        </span>
    );
}
