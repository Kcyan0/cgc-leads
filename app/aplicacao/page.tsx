import { getFlowConfig } from "@/lib/flow";
import Wizard from "@/components/wizard/Wizard";

export const dynamic = "force-dynamic";

export default async function AplicacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string }>;
}) {
  const flow = await getFlowConfig();
  const { origin } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Wizard flow={flow} origin={origin} />
    </main>
  );
}
