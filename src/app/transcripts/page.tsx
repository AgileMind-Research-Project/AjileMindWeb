import { Suspense } from "react";
import TranscriptList from "@/components/transcripts/TranscriptList";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function TranscriptsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading...</div>}>
        <TranscriptList />
      </Suspense>
    </DashboardLayout>
  );
}
