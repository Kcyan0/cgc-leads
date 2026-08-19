"use client";

import { useState } from "react";
import { findNode, resolveNextNode, type FlowGraph, type FlowNode } from "@/lib/flow";

export default function PreviewModal({ graph, onClose }: { graph: FlowGraph; onClose: () => void }) {
  const entryNode = findNode(graph, graph.entryNodeId) as FlowNode;
  const [currentNode, setCurrentNode] = useState<FlowNode>(entryNode);
  const [tags, setTags] = useState<string[]>([]);

  function advance(newTags: string[]) {
    const merged = Array.from(new Set([...tags, ...newTags]));
    setTags(merged);
    const edge = resolveNextNode(graph, currentNode.id, merged);
    if (edge) setCurrentNode(findNode(graph, edge.to) as FlowNode);
  }

  function reset() {
    setCurrentNode(entryNode);
    setTags([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Pré-visualização</span>
          <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Fechar">
            ✕
          </button>
        </div>

        {currentNode.type === "intro" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <h1 className="text-xl font-semibold text-white">{currentNode.data.title}</h1>
            <p className="mt-2 text-sm text-white/60">{currentNode.data.body}</p>
            <button
              onClick={() => advance([])}
              className="mt-6 w-full rounded-xl bg-white py-2.5 font-medium text-black hover:opacity-90"
            >
              Começar
            </button>
          </div>
        )}

        {currentNode.type === "contact" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-white">{currentNode.data.question}</h2>
            <p className="mt-1 text-sm text-white/50">{currentNode.data.help}</p>
            <button
              onClick={() => advance([])}
              className="mt-6 w-full rounded-xl bg-white py-2.5 font-medium text-black hover:opacity-90"
            >
              Continuar (simulado)
            </button>
          </div>
        )}

        {currentNode.type === "choice" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-white">{currentNode.data.question}</h2>
            <div className="mt-4 space-y-2">
              {currentNode.data.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => advance(opt.tags)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-left text-sm text-white transition hover:border-white"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentNode.type === "outcome" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <h2 className="text-base font-semibold text-white">{currentNode.data.title}</h2>
            <p className="mt-2 text-sm text-white/60">{currentNode.data.body}</p>
            <button onClick={reset} className="mt-6 text-xs text-white/40 underline underline-offset-2 hover:text-white">
              Recomeçar simulação
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-white/25">
          Simulação local — nenhum lead é criado aqui.
        </p>
      </div>
    </div>
  );
}
