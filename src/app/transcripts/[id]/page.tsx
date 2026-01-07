import TranscriptDetail from "@/components/transcripts/TranscriptDetail";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function TranscriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <TranscriptDetail transcriptId={parseInt(id)} />
    </DashboardLayout>
  );
}
