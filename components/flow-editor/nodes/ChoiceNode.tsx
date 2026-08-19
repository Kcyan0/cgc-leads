import type { NodeProps } from "@xyflow/react";
import type { NodeAnalytics } from "@/lib/analytics";
import type { StepOption } from "@/lib/flow";
import NodeShell from "./NodeShell";

export default function ChoiceNode({ data, selected }: NodeProps) {
  const d = data as { question: string; options: StepOption[]; stats?: NodeAnalytics };
  return (
    <NodeShell badge="Pergunta" title={d.question} selected={selected} stats={d.stats}>
      <ul className="mt-1.5 space-y-0.5">
        {d.options.map((opt) => (
          <li key={opt.id} className="truncate text-xs text-white/50">
            {opt.label}
            {opt.tags.length > 0 && <span className="text-white/25"> · {opt.tags.join(", ")}</span>}
          </li>
        ))}
      </ul>
    </NodeShell>
  );
}
