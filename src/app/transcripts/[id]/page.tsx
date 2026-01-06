import TranscriptDetail from "@/components/transcripts/TranscriptDetail";

export default async function TranscriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TranscriptDetail transcriptId={parseInt(id)} />;
}
