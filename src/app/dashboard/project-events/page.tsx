import React, { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectEventBoard from '@/components/projects/ProjectEventBoard';

export const metadata = {
    title: 'Project Events | AjileMind',
    description: 'Manage and review meeting transcripts for project events.',
};

export default function ProjectEventsPage() {
    return (
        <DashboardLayout showSidebar={true}>
            <Suspense fallback={<div className="flex justify-center items-center h-screen animate-pulse text-blue-600 font-bold">Loading AjileMind Events...</div>}>
                <ProjectEventBoard />
            </Suspense>
        </DashboardLayout>
    );
}
