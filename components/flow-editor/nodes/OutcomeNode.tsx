import type { NodeProps } from "@xyflow/react";
import type { NodeAnalytics } from "@/lib/analytics";
import NodeShell from "./NodeShell";

export default function OutcomeNode({ data, selected }: NodeProps) {
  const d = data as { title: string; body: string; qualified: boolean; stats?: NodeAnalytics };
  return (
    <NodeShell
      badge={`Fim · ${d.qualified ? "Qualificado" : "Não qualificado"}`}
      title={d.title}
      selected={selected}
      stats={d.stats}
      hasSource={false}
    >
      <p className="mt-1 line-clamp-2 text-xs text-white/50">{d.body}</p>
    </NodeShell>
  );
}
