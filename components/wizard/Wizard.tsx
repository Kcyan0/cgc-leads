"use client";

import { useState } from "react";
import { findNode, type FlowGraph, type FlowNode } from "@/lib/flow";

export default function Wizard({ graph, origin }: { graph: FlowGraph; origin?: string }) {
  const entryNode = findNode(graph, graph.entryNodeId) as FlowNode;
  const [currentNode, setCurrentNode] = useState<FlowNode>(entryNode);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [outcome, setOutcome] = useState<{ title: string; body: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goTo(node: FlowNode) {
    if (node.type === "choice") setQuestionNumber((n) => n + 1);
    setCurrentNode(node);
  }

  async function saveProgress(payload: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId ?? undefined,
          origin: leadId ? undefined : origin,
          ...payload,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const json = await res.json();
      if (json.id) setLeadId(json.id);
      return json as { id: string; nextNode: FlowNode; outcome?: { title: string; body: string } };
    } catch {
      setError("Não foi possível salvar sua resposta. Tente novamente.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIntroContinue() {
    const result = await saveProgress({ currentNodeId: currentNode.id });
    if (!result) return;
    if (result.outcome) setOutcome(result.outcome);
    goTo(result.nextNode);
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const result = await saveProgress({ currentNodeId: currentNode.id, name, phone });
    if (!result) return;
    if (result.outcome) setOutcome(result.outcome);
    goTo(result.nextNode);
  }

  async function handleAnswer(optionId: string) {
    const result = await saveProgress({ currentNodeId: currentNode.id, optionId });
    if (!result) return;
    if (result.outcome) setOutcome(result.outcome);
    goTo(result.nextNode);
  }

  const skylineVariant = currentNode.type === "intro" || currentNode.type === "outcome" ? "full" : "sliver";

  return (
    <div className="relative w-full">
      <Skyline variant={skylineVariant} />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {currentNode.type === "choice" && (
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            Pergunta {questionNumber}
          </p>
        )}

        {currentNode.type === "intro" && (
          <>
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                CGC
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Aplicação
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <h1 className="text-2xl font-semibold text-white">{currentNode.data.title}</h1>
              <p className="mt-3 text-sm text-white/60">{currentNode.data.body}</p>
              <button
                onClick={handleIntroContinue}
                disabled={submitting}
                className="mt-8 w-full rounded-xl bg-accent py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "Enviando..." : "Começar"}
              </button>
            </div>
          </>
        )}

        {currentNode.type === "contact" && (
          <form
            onSubmit={handleContactSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
          >
            <h2 className="text-xl font-semibold text-white">{currentNode.data.question}</h2>
            <p className="mt-1 text-sm text-white/50">{currentNode.data.help}</p>
            <div className="mt-6 space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Seu WhatsApp (com DDD)"
                inputMode="tel"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !phone.trim()}
              className="mt-6 w-full rounded-xl bg-accent py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Enviando..." : "Continuar"}
            </button>
          </form>
        )}

        {currentNode.type === "choice" && (
          <ChoiceStep
            question={currentNode.data.question}
            options={currentNode.data.options}
            onSelect={handleAnswer}
            submitting={submitting}
          />
        )}

        {currentNode.type === "outcome" && outcome && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <svg viewBox="0 0 48 48" width="44" height="44" className="mx-auto mb-4 block">
              <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              <path
                d="M14 24 L21 31 L34 17"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-xl font-semibold text-white">{outcome.title}</h2>
            <p className="mt-3 text-sm text-white/60">{outcome.body}</p>
          </div>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function ChoiceStep({
  question,
  options,
  onSelect,
  submitting,
}: {
  question: string;
  options: { id: string; label: string }[];
  onSelect: (optionId: string) => void;
  submitting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <h2 className="text-xl font-semibold text-white">{question}</h2>
      <div className="mt-6 space-y-3">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            disabled={submitting}
            onClick={() => onSelect(opt.id)}
            className="flex w-full items-center gap-3.5 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left text-white transition hover:border-accent hover:bg-white/10 disabled:opacity-40"
          >
            <BarIcon filled={i + 1} />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BarIcon({ filled }: { filled: number }) {
  const bars = [
    { x: 0, y: 11, h: 5 },
    { x: 5, y: 8, h: 8 },
    { x: 10, y: 5, h: 11 },
    { x: 15, y: 2, h: 14 },
  ];
  return (
    <svg viewBox="0 0 20 16" width="20" height="16" className="shrink-0">
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={3}
          height={bar.h}
          fill={i < filled ? "#ffffff" : "rgba(255,255,255,0.15)"}
        />
      ))}
    </svg>
  );
}

function Skyline({ variant }: { variant: "full" | "sliver" }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 overflow-hidden"
      style={{
        height: variant === "full" ? "clamp(140px, 34vh, 300px)" : "clamp(64px, 13vh, 130px)",
        opacity: variant === "full" ? 1 : 0.6,
      }}
    >
      <svg viewBox="0 0 430 260" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" className="block">
        <defs>
          <pattern id="skyline-windows" width="7" height="11" patternUnits="userSpaceOnUse">
            <rect x="1" y="1" width="3" height="5" fill="rgba(255,255,255,0.5)" />
          </pattern>
        </defs>
        <rect x="0" y="258" width="430" height="2" fill="rgba(255,255,255,0.12)" />
        <rect x="0" y="170" width="30" height="90" fill="rgba(255,255,255,0.08)" />
        <rect x="32" y="120" width="22" height="140" fill="rgba(255,255,255,0.08)" />
        <rect x="58" y="190" width="40" height="70" fill="rgba(255,255,255,0.09)" />
        <rect x="65" y="160" width="26" height="30" fill="rgba(255,255,255,0.09)" />
        <rect x="72" y="148" width="12" height="12" fill="rgba(255,255,255,0.09)" />
        <rect x="100" y="200" width="18" height="60" fill="rgba(255,255,255,0.08)" />
        <rect x="122" y="80" width="34" height="180" fill="rgba(255,255,255,0.10)" />
        <rect x="122" y="80" width="34" height="180" fill="url(#skyline-windows)" opacity={0.4} />
        <line x1="139" y1="80" x2="139" y2="55" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        <rect x="158" y="165" width="24" height="95" fill="rgba(255,255,255,0.08)" />
        <rect x="184" y="130" width="46" height="130" fill="rgba(255,255,255,0.09)" />
        <rect x="194" y="105" width="26" height="25" fill="rgba(255,255,255,0.09)" />
        <rect x="202" y="92" width="10" height="13" fill="rgba(255,255,255,0.09)" />
        <rect x="232" y="190" width="20" height="70" fill="rgba(255,255,255,0.08)" />
        <rect x="254" y="110" width="28" height="150" fill="rgba(255,255,255,0.08)" />
        <rect x="284" y="160" width="36" height="100" fill="rgba(255,255,255,0.08)" />
        <rect x="322" y="90" width="20" height="170" fill="rgba(255,255,255,0.10)" />
        <rect x="322" y="90" width="20" height="170" fill="url(#skyline-windows)" opacity={0.4} />
        <rect x="344" y="180" width="30" height="80" fill="rgba(255,255,255,0.08)" />
        <rect x="376" y="140" width="24" height="120" fill="rgba(255,255,255,0.08)" />
        <rect x="402" y="165" width="28" height="95" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  );
}
