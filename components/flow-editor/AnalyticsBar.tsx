"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FlowAnalytics } from "@/lib/analytics";
import type { FlowGraph } from "@/lib/flow";
import { findNode } from "@/lib/flow";

const RANGE_OPTIONS = [
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "30dias", label: "Últimos 30 dias" },
  { value: "tudo", label: "Todo o período" },
];

function nodeLabel(graph: FlowGraph, nodeId: string): string {
  const node = findNode(graph, nodeId);
  if (!node) return nodeId;
  if (node.type === "choice") return node.data.question;
  if (node.type === "outcome") return node.data.title;
  if (node.type === "contact") return node.data.question;
  return node.data.title;
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

export default function AnalyticsBar({ graph, analytics }: { graph: FlowGraph; analytics: FlowAnalytics }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("periodo") ?? "7dias";

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-black">
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => router.refresh()}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Total de leads" value={String(analytics.totalLeads)} />
        <Stat label="Iniciados" value={String(analytics.iniciados)} />
        <Stat label="Concluídos" value={String(analytics.concluidos)} />
        <Stat label="Conversão total" value={pct(analytics.conversaoTotal)} emphasis />
        <Stat label="Abandono médio" value={pct(analytics.abandonoMedio)} />
        <Stat
          label="Tempo médio"
          value={analytics.tempoMedioSegundos !== null ? `${Math.round(analytics.tempoMedioSegundos)}s` : "—"}
        />
        <Stat
          label="Maior conversão"
          value={analytics.maiorConversao ? pct(analytics.maiorConversao.pct) : "—"}
          hint={analytics.maiorConversao ? nodeLabel(graph, analytics.maiorConversao.nodeId) : undefined}
        />
        <Stat
          label="Maior abandono"
          value={analytics.maiorAbandono ? pct(analytics.maiorAbandono.pct) : "—"}
          hint={analytics.maiorAbandono ? nodeLabel(graph, analytics.maiorAbandono.nodeId) : undefined}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${emphasis ? "border-white bg-white" : "border-white/10 bg-white/[0.03]"}`}
    >
      <p className={`text-[10px] font-medium uppercase tracking-wide ${emphasis ? "text-black/50" : "text-white/40"}`}>
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${emphasis ? "text-black" : "text-white"}`}>{value}</p>
      {hint && <p className={`truncate text-[10px] ${emphasis ? "text-black/50" : "text-white/30"}`}>{hint}</p>}
    </div>
  );
}
