import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

export function edgeLabel(requiredTags: string[]): string {
  return requiredTags.length === 0 ? "sempre" : requiredTags.join(" + ");
}

export default function ConditionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const requiredTags = (data?.requiredTags as string[] | undefined) ?? [];
  const onLabelClick = data?.onLabelClick as (() => void) | undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: selected ? "#ffffff" : "rgba(255,255,255,0.3)", strokeWidth: selected ? 2 : 1.5 }}
      />
      <EdgeLabelRenderer>
        <button
          onClick={onLabelClick}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            selected
              ? "border-white bg-white text-black"
              : "border-white/20 bg-black text-white/60"
          }`}
        >
          {edgeLabel(requiredTags)}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
