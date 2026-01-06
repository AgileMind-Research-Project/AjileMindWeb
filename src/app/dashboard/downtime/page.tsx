'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DownTimeSender from '@/components/notifications/DownTimeSender';

export default function DowntimePage() {
    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-64px)] p-4">
                <DownTimeSender />
            </div>
        </DashboardLayout>
    );
}
