import type { NodeProps } from "@xyflow/react";
import type { NodeAnalytics } from "@/lib/analytics";
import NodeShell from "./NodeShell";

export default function IntroNode({ data, selected }: NodeProps) {
  const d = data as { title: string; body: string; stats?: NodeAnalytics };
  return (
    <NodeShell badge="Início · Introdução" title={d.title} selected={selected} stats={d.stats} hasTarget={false}>
      <p className="mt-1 line-clamp-2 text-xs text-white/50">{d.body}</p>
    </NodeShell>
  );
}
