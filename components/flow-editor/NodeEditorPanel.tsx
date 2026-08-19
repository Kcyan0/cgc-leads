"use client";

import { useId } from "react";
import type { FlowEdge, FlowNode, StepOption } from "@/lib/flow";
import { edgeLabel } from "./edges/ConditionEdge";

export type Selection = { kind: "node"; node: FlowNode } | { kind: "edge"; edge: FlowEdge } | null;

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function NodeEditorPanel({
  selection,
  allTags,
  canDeleteNode,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}: {
  selection: Selection;
  allTags: string[];
  canDeleteNode: (node: FlowNode) => boolean;
  onUpdateNode: (node: FlowNode) => void;
  onUpdateEdge: (edge: FlowEdge) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onClose: () => void;
}) {
  if (!selection) return null;

  return (
    <aside className="absolute right-4 top-4 bottom-4 z-20 w-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          {selection.kind === "node" ? "Editar etapa" : "Editar condição"}
        </h2>
        <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Fechar">
          ✕
        </button>
      </div>

      <div className="mt-4">
        {selection.kind === "node" && (
          <NodeFields
            node={selection.node}
            canDelete={canDeleteNode(selection.node)}
            onUpdate={onUpdateNode}
            onDelete={() => onDeleteNode(selection.node.id)}
          />
        )}
        {selection.kind === "edge" && (
          <EdgeFields
            edge={selection.edge}
            allTags={allTags}
            onUpdate={onUpdateEdge}
            onDelete={() => onDeleteEdge(selection.edge.id)}
          />
        )}
      </div>
    </aside>
  );
}

function NodeFields({
  node,
  canDelete,
  onUpdate,
  onDelete,
}: {
  node: FlowNode;
  canDelete: boolean;
  onUpdate: (node: FlowNode) => void;
  onDelete: () => void;
}) {
  const outcomeCheckboxId = useId();

  if (node.type === "intro") {
    return (
      <div className="space-y-3">
        <Field label="Título" value={node.data.title} onChange={(v) => onUpdate({ ...node, data: { ...node.data, title: v } })} />
        <Field label="Texto" textarea value={node.data.body} onChange={(v) => onUpdate({ ...node, data: { ...node.data, body: v } })} />
      </div>
    );
  }

  if (node.type === "contact") {
    return (
      <div className="space-y-3">
        <Field
          label="Pergunta"
          value={node.data.question}
          onChange={(v) => onUpdate({ ...node, data: { ...node.data, question: v } })}
        />
        <Field
          label="Texto de apoio"
          value={node.data.help}
          onChange={(v) => onUpdate({ ...node, data: { ...node.data, help: v } })}
        />
      </div>
    );
  }

  if (node.type === "choice") {
    function updateOption(i: number, next: StepOption) {
      if (node.type !== "choice") return;
      const options = [...node.data.options];
      options[i] = next;
      onUpdate({ ...node, data: { ...node.data, options } });
    }
    function addOption() {
      if (node.type !== "choice") return;
      onUpdate({
        ...node,
        data: { ...node.data, options: [...node.data.options, { id: newId("opt"), label: "Nova opção", tags: [] }] },
      });
    }
    function removeOption(i: number) {
      if (node.type !== "choice") return;
      if (node.data.options.length <= 1) return;
      onUpdate({ ...node, data: { ...node.data, options: node.data.options.filter((_, idx) => idx !== i) } });
    }

    return (
      <div className="space-y-3">
        <Field
          label="Pergunta"
          value={node.data.question}
          onChange={(v) => onUpdate({ ...node, data: { ...node.data, question: v } })}
        />
        <div>
          <span className="mb-1.5 block text-xs font-medium text-white/40">Opções e tags</span>
          <div className="space-y-2">
            {node.data.options.map((opt, i) => (
              <div key={opt.id} className="space-y-1 rounded-lg border border-white/10 p-2">
                <input
                  value={opt.label}
                  onChange={(e) => updateOption(i, { ...opt, label: e.target.value })}
                  placeholder="Texto da opção"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white outline-none focus:border-accent"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    value={opt.tags.join(", ")}
                    onChange={(e) =>
                      updateOption(i, {
                        ...opt,
                        tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="tags (ex: qualificado)"
                    className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white/70 outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    disabled={node.data.options.length <= 1}
                    className="shrink-0 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/40 hover:text-white disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addOption} className="mt-2 text-xs text-white/40 underline underline-offset-2 hover:text-white">
            + Adicionar opção
          </button>
        </div>
      </div>
    );
  }

  // outcome
  return (
    <div className="space-y-3">
      <Field label="Título" value={node.data.title} onChange={(v) => onUpdate({ ...node, data: { ...node.data, title: v } })} />
      <Field label="Texto" textarea value={node.data.body} onChange={(v) => onUpdate({ ...node, data: { ...node.data, body: v } })} />
      <label htmlFor={outcomeCheckboxId} className="flex items-center gap-2 text-sm text-white/70">
        <input
          id={outcomeCheckboxId}
          type="checkbox"
          checked={node.data.qualified}
          onChange={(e) => onUpdate({ ...node, data: { ...node.data, qualified: e.target.checked } })}
          className="h-4 w-4 rounded border-white/20 bg-black/30 accent-white"
        />
        Marca o lead como qualificado (hot)
      </label>
      {canDelete && <DeleteButton onClick={onDelete} label="Excluir etapa" />}
    </div>
  );
}

function EdgeFields({
  edge,
  allTags,
  onUpdate,
  onDelete,
}: {
  edge: FlowEdge;
  allTags: string[];
  onUpdate: (edge: FlowEdge) => void;
  onDelete: () => void;
}) {
  function toggleTag(tag: string) {
    const has = edge.requiredTags.includes(tag);
    const requiredTags = has ? edge.requiredTags.filter((t) => t !== tag) : [...edge.requiredTags, tag];
    onUpdate({ ...edge, requiredTags });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">
        Esta transição acontece quando o lead tem <strong className="text-white/70">todas</strong> as tags marcadas.
        Sem tags marcadas = sempre (padrão).
      </p>
      <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">{edgeLabel(edge.requiredTags)}</p>
      {allTags.length === 0 && <p className="text-xs text-white/30">Nenhuma tag definida ainda nas perguntas.</p>}
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              edge.requiredTags.includes(tag)
                ? "border-white bg-white text-black"
                : "border-white/15 text-white/50 hover:text-white"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <DeleteButton onClick={onDelete} label="Excluir conexão" />
    </div>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-red-500/30 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/40">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      )}
    </label>
  );
}
