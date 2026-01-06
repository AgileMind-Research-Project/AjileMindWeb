"use client";

import { useState } from "react";
import { use } from "react";
import ReportViewer from "@/components/reports/ReportViewer";
import ReportEditor from "@/components/reports/ReportEditor";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isEditing, setIsEditing] = useState(false);
  
  return isEditing ? (
    <ReportEditor 
      reportId={parseInt(id)} 
      onSave={() => setIsEditing(false)} 
      onCancel={() => setIsEditing(false)}
    />
  ) : (
    <ReportViewer 
      reportId={parseInt(id)} 
      onEdit={() => setIsEditing(true)} 
    />
  );
}
