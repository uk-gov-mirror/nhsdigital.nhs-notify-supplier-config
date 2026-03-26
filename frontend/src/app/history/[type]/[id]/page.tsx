import { PlaceholderPage } from "@/components/placeholder-page";

type HistoryPageProps = Readonly<{
  params: Promise<{ id: string; type: string }>;
}>;

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id, type } = await params;

  return (
    <PlaceholderPage
      title={`History for ${type}`}
      description={`This area will show version history and audit details for ${type} record ${id}.`}
    />
  );
}
