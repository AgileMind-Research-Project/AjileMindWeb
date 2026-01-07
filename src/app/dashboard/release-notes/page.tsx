'use client';

import ReleaseNotes from '@/pages/dashboard/ReleaseNotes';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReleaseNotesPage() {
    return (
        <DashboardLayout>
            <ReleaseNotes />
        </DashboardLayout>
    );
}
