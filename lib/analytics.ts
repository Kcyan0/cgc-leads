import { prisma } from "@/lib/db";
import type { FlowGraph } from "@/lib/flow";

type VisitedEntry = { nodeId: string; at: string };

export type NodeAnalytics = {
  reached: number;
  /** Share of leads that reached this node and then reached each next node, keyed by next node id. */
  nextNodeShare: Record<string, number>;
  abandonment: number;
  avgSecondsInNode: number | null;
};

export type FlowAnalytics = {
  byNode: Record<string, NodeAnalytics>;
  totalLeads: number;
  iniciados: number;
  concluidos: number;
  conversaoTotal: number;
  abandonoMedio: number;
  tempoMedioSegundos: number | null;
  maiorConversao: { nodeId: string; pct: number } | null;
  maiorAbandono: { nodeId: string; pct: number } | null;
};

export type DateRange = { gte?: Date; lte?: Date };

export async function computeFlowAnalytics(graph: FlowGraph, range: DateRange): Promise<FlowAnalytics> {
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: range.gte, lte: range.lte } },
    select: { visited: true, completed: true, createdAt: true },
  });

  const nodeIds = graph.nodes.map((n) => n.id);
  const byNode: Record<string, NodeAnalytics> = {};
  for (const id of nodeIds) {
    byNode[id] = { reached: 0, nextNodeShare: {}, abandonment: 0, avgSecondsInNode: null };
  }

  const abandonedCount: Record<string, number> = {};
  const timeSums: Record<string, { totalMs: number; count: number }> = {};

  let iniciados = 0;
  let concluidos = 0;

  for (const lead of leads) {
    const visited = Array.isArray(lead.visited) ? (lead.visited as unknown as VisitedEntry[]) : [];
    if (visited.length === 0) continue;
    iniciados++;
    if (lead.completed) concluidos++;

    for (let i = 0; i < visited.length; i++) {
      const entry = visited[i];
      const stats = byNode[entry.nodeId];
      if (!stats) continue;
      stats.reached++;

      const next = visited[i + 1];
      if (next) {
        stats.nextNodeShare[next.nodeId] = (stats.nextNodeShare[next.nodeId] ?? 0) + 1;
        const ms = new Date(next.at).getTime() - new Date(entry.at).getTime();
        if (Number.isFinite(ms) && ms >= 0) {
          const sum = (timeSums[entry.nodeId] ??= { totalMs: 0, count: 0 });
          sum.totalMs += ms;
          sum.count++;
        }
      } else if (!lead.completed) {
        abandonedCount[entry.nodeId] = (abandonedCount[entry.nodeId] ?? 0) + 1;
      }
    }
  }

  for (const id of nodeIds) {
    const stats = byNode[id];
    const reached = stats.reached;
    const nextTotal = Object.values(stats.nextNodeShare).reduce((a, b) => a + b, 0);
    if (reached > 0) {
      for (const target of Object.keys(stats.nextNodeShare)) {
        stats.nextNodeShare[target] = stats.nextNodeShare[target] / reached;
      }
      stats.abandonment = (abandonedCount[id] ?? 0) / reached;
    }
    void nextTotal;
    const sum = timeSums[id];
    stats.avgSecondsInNode = sum && sum.count > 0 ? sum.totalMs / sum.count / 1000 : null;
  }

  const abandonmentRates = Object.values(byNode)
    .filter((s) => s.reached > 0)
    .map((s) => s.abandonment);
  const abandonoMedio =
    abandonmentRates.length > 0 ? abandonmentRates.reduce((a, b) => a + b, 0) / abandonmentRates.length : 0;

  const allTimes = Object.values(timeSums);
  const totalMs = allTimes.reduce((a, s) => a + s.totalMs, 0);
  const totalCount = allTimes.reduce((a, s) => a + s.count, 0);
  const tempoMedioSegundos = totalCount > 0 ? totalMs / totalCount / 1000 : null;

  let maiorConversao: { nodeId: string; pct: number } | null = null;
  let maiorAbandono: { nodeId: string; pct: number } | null = null;
  for (const [nodeId, stats] of Object.entries(byNode)) {
    if (stats.reached === 0) continue;
    const bestNext = Object.values(stats.nextNodeShare).reduce((a, b) => Math.max(a, b), 0);
    if (bestNext > 0 && (!maiorConversao || bestNext > maiorConversao.pct)) {
      maiorConversao = { nodeId, pct: bestNext };
    }
    if (!maiorAbandono || stats.abandonment > maiorAbandono.pct) {
      maiorAbandono = { nodeId, pct: stats.abandonment };
    }
  }

  return {
    byNode,
    totalLeads: leads.length,
    iniciados,
    concluidos,
    conversaoTotal: iniciados > 0 ? concluidos / iniciados : 0,
    abandonoMedio,
    tempoMedioSegundos,
    maiorConversao,
    maiorAbandono,
  };
}
