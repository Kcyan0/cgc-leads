"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowEdge, FlowGraph, FlowNode, StepOption } from "@/lib/flow";
import type { NodeAnalytics } from "@/lib/analytics";
import IntroNode from "./nodes/IntroNode";
import ContactNode from "./nodes/ContactNode";
import ChoiceNode from "./nodes/ChoiceNode";
import OutcomeNode from "./nodes/OutcomeNode";
import ConditionEdge from "./edges/ConditionEdge";
import NodeEditorPanel, { type Selection } from "./NodeEditorPanel";
import PreviewModal from "./PreviewModal";

const nodeTypes: NodeTypes = {
  intro: IntroNode,
  contact: ContactNode,
  choice: ChoiceNode,
  outcome: OutcomeNode,
};

const edgeTypes: EdgeTypes = {
  condition: ConditionEdge,
};

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function toXyNodes(nodes: FlowNode[], stats: Record<string, NodeAnalytics>): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data, stats: stats[n.id] },
  }));
}

function toXyEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: "condition",
    data: { requiredTags: e.requiredTags },
  }));
}

function toFlowNode(n: Node): FlowNode {
  const { stats: _stats, ...rest } = n.data as Record<string, unknown>;
  void _stats;
  return { id: n.id, type: n.type, position: n.position, data: rest } as FlowNode;
}

function toFlowEdge(e: Edge): FlowEdge {
  return { id: e.id, from: e.source, to: e.target, requiredTags: (e.data?.requiredTags as string[]) ?? [] };
}

export default function FlowEditor({
  initialGraph,
  stats,
}: {
  initialGraph: FlowGraph;
  stats: Record<string, NodeAnalytics>;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toXyNodes(initialGraph.nodes, stats));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toXyEdges(initialGraph.edges));
  const [selection, setSelection] = useState<Selection>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const n of nodes) {
      if (n.type === "choice") {
        for (const opt of (n.data.options as StepOption[]) ?? []) {
          opt.tags.forEach((t) => tags.add(t));
        }
      }
    }
    return Array.from(tags);
  }, [nodes]);

  const outcomeCount = useMemo(() => nodes.filter((n) => n.type === "outcome").length, [nodes]);

  const renderedEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        data: { ...e.data, onLabelClick: () => setSelection({ kind: "edge", edge: toFlowEdge(e) }) },
      })),
    [edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, id: newId("e"), type: "condition", data: { requiredTags: [] } }, eds)
      );
    },
    [setEdges]
  );

  function handleNodeUpdate(updated: FlowNode) {
    setNodes((nds) =>
      nds.map((n) => (n.id === updated.id ? { ...n, data: { ...updated.data, stats: n.data.stats } } : n))
    );
    setSelection({ kind: "node", node: updated });
  }

  function handleEdgeUpdate(updated: FlowEdge) {
    setEdges((eds) =>
      eds.map((e) => (e.id === updated.id ? { ...e, data: { requiredTags: updated.requiredTags } } : e))
    );
    setSelection({ kind: "edge", edge: updated });
  }

  function deleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelection(null);
  }

  function deleteEdge(id: string) {
    setEdges((eds) => eds.filter((e) => e.id !== id));
    setSelection(null);
  }

  function canDeleteNode(node: FlowNode) {
    if (node.type === "intro" || node.type === "contact") return false;
    if (node.type === "outcome" && outcomeCount <= 1) return false;
    return true;
  }

  function addNode(type: "choice" | "outcome") {
    const offset = nodes.length * 24;
    const position = { x: 200 + offset, y: 420 + (nodes.length % 3) * 140 };
    const node: Node =
      type === "choice"
        ? {
            id: newId("q"),
            type: "choice",
            position,
            data: {
              question: "Nova pergunta",
              options: [
                { id: newId("opt"), label: "Opção A", tags: [] },
                { id: newId("opt"), label: "Opção B", tags: [] },
              ],
            },
          }
        : {
            id: newId("out"),
            type: "outcome",
            position,
            data: { title: "Aplicação recebida", body: "Descreva a mensagem final.", qualified: false },
          };
    setNodes((nds) => [...nds, node]);
  }

  function currentGraph(): FlowGraph {
    const introNode = nodes.find((n) => n.type === "intro");
    return {
      nodes: nodes.map(toFlowNode),
      edges: edges.map(toFlowEdge),
      entryNodeId: introNode?.id ?? initialGraph.entryNodeId,
    };
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/flow-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentGraph()),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "failed");
      }
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!confirm("Publicar este fluxo? O formulário público vai passar a usar esta versão imediatamente.")) {
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const saveRes = await fetch("/api/admin/flow-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentGraph()),
      });
      if (!saveRes.ok) throw new Error("failed to save before publishing");
      const res = await fetch("/api/admin/flow-publish", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      setPublishedAt(Date.now());
    } catch {
      setError("Não foi possível publicar.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="cgc-flow relative h-[calc(100vh-4rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-white/40 hover:text-white">
            ← Leads
          </Link>
          <button
            onClick={() => addNode("choice")}
            className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:text-white"
          >
            + Pergunta
          </button>
          <button
            onClick={() => addNode("outcome")}
            className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:text-white"
          >
            + Resultado
          </button>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          {savedAt && <span className="text-xs text-white/40">Rascunho salvo</span>}
          {publishedAt && <span className="text-xs text-white/40">Publicado!</span>}
          <button
            onClick={() => setShowPreview(true)}
            className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:text-white"
          >
            Pré-visualizar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur transition hover:text-white disabled:opacity-40"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={renderedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
        onNodeClick={(_, node) => setSelection({ kind: "node", node: toFlowNode(node) })}
        onEdgeClick={(_, edge) => setSelection({ kind: "edge", edge: toFlowEdge(edge) })}
        onPaneClick={() => setSelection(null)}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.15)" gap={20} />
        <Controls className="!border !border-white/10 !bg-black" />
        <MiniMap
          className="!border !border-white/10 !bg-black"
          maskColor="rgba(0,0,0,0.85)"
          nodeColor="rgba(255,255,255,0.5)"
        />
      </ReactFlow>

      <NodeEditorPanel
        selection={selection}
        allTags={allTags}
        canDeleteNode={canDeleteNode}
        onUpdateNode={handleNodeUpdate}
        onUpdateEdge={handleEdgeUpdate}
        onDeleteNode={deleteNode}
        onDeleteEdge={deleteEdge}
        onClose={() => setSelection(null)}
      />

      {showPreview && <PreviewModal graph={currentGraph()} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
