"use client";

import { use } from "react";
import TemplateEditor from "@/components/reports/TemplateEditor";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <DashboardLayout>
      <TemplateEditor templateId={parseInt(id)} />
    </DashboardLayout>
  );
}
