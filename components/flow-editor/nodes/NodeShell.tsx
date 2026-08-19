import { Handle, Position } from "@xyflow/react";
import type { NodeAnalytics } from "@/lib/analytics";

export function StatLine({ stats }: { stats?: NodeAnalytics }) {
  if (!stats || stats.reached === 0) {
    return <p className="mt-2 text-[11px] text-white/25">sem dados ainda</p>;
  }
  const bestNext = Object.values(stats.nextNodeShare).reduce((a, b) => Math.max(a, b), 0);
  return (
    <p className="mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-white/40">
      <span>{stats.reached} leads</span>
      {bestNext > 0 && <span>↗ {Math.round(bestNext * 100)}%</span>}
      {stats.abandonment > 0 && <span>↘ {Math.round(stats.abandonment * 100)}%</span>}
      {stats.avgSecondsInNode !== null && <span>{Math.round(stats.avgSecondsInNode)}s</span>}
    </p>
  );
}

export default function NodeShell({
  badge,
  title,
  children,
  selected,
  stats,
  hasTarget = true,
  hasSource = true,
}: {
  badge: string;
  title: string;
  children?: React.ReactNode;
  selected?: boolean;
  stats?: NodeAnalytics;
  hasTarget?: boolean;
  hasSource?: boolean;
}) {
  return (
    <div
      className={`w-60 rounded-xl border bg-[#0a0a0a] px-4 py-3 shadow-lg transition ${
        selected ? "border-white" : "border-white/15"
      }`}
    >
      {hasTarget && <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-white/40 !bg-black" />}
      {hasSource && <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-white/40 !bg-black" />}
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">{badge}</span>
      <h3 className="mt-1 truncate text-sm font-semibold text-white">{title}</h3>
      {children}
      <StatLine stats={stats} />
    </div>
  );
}
