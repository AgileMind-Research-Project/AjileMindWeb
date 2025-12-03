'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectManagerDashboard from '@/components/projects/ProjectManagerDashboard';

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ProjectManagerDashboard />
      </div>
    </DashboardLayout>
  );
}
