import { getPublishedGraph } from "@/lib/flow-db";
import Wizard from "@/components/wizard/Wizard";

export const dynamic = "force-dynamic";

export default async function AplicacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string }>;
}) {
  const graph = await getPublishedGraph();
  const { origin } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Wizard graph={graph} origin={origin} />
    </main>
  );
}
