import type { NodeProps } from "@xyflow/react";
import type { NodeAnalytics } from "@/lib/analytics";
import NodeShell from "./NodeShell";

export default function ContactNode({ data, selected }: NodeProps) {
  const d = data as { question: string; help: string; stats?: NodeAnalytics };
  return (
    <NodeShell badge="Nome + telefone" title={d.question} selected={selected} stats={d.stats}>
      <p className="mt-1 line-clamp-2 text-xs text-white/50">{d.help}</p>
    </NodeShell>
  );
}
