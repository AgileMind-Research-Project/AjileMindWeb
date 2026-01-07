'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DownTimeSender from '@/components/notifications/DownTimeSender';

export default function DowntimePage() {
    return (
        <DashboardLayout mainClassName="p-4">
            <div className="h-[calc(100vh-64px-32px)]">
                <DownTimeSender />
            </div>
        </DashboardLayout>
    );
}
