import { getDraftGraph } from "@/lib/flow-db";
import { computeFlowAnalytics } from "@/lib/analytics";
import FlowEditor from "@/components/flow-editor/FlowEditor";
import AnalyticsBar from "@/components/flow-editor/AnalyticsBar";

export const dynamic = "force-dynamic";

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export default async function FluxoPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const graph = await getDraftGraph();

  const range =
    periodo === "30dias"
      ? { gte: startOfDay(-30) }
      : periodo === "tudo"
        ? {}
        : { gte: startOfDay(-7) };

  const analytics = await computeFlowAnalytics(graph, range);

  return (
    <main className="min-h-screen bg-background px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-xl font-semibold text-white">Editor de Fluxo</h1>
          <p className="mt-1 text-sm text-white/50">
            Arraste para reorganizar, clique numa etapa para editá-la, ou numa seta para configurar a
            condição. Use <strong className="text-white/70">Salvar</strong> para guardar como rascunho e{" "}
            <strong className="text-white/70">Publicar</strong> para tornar o fluxo ativo no formulário público.
          </p>
        </div>

        <div className="mt-4">
          <AnalyticsBar graph={graph} analytics={analytics} />
        </div>

        <div className="mt-4">
          <FlowEditor initialGraph={graph} stats={analytics.byNode} />
        </div>
      </div>
    </main>
  );
}
