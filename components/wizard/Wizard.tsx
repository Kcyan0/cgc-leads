"use client";

import { useState } from "react";
import type { FlowSteps } from "@/lib/flow";

type Step = "intro" | "contact" | number | "outcome";

export default function Wizard({
  flow,
  origin,
}: {
  flow: FlowSteps;
  origin?: string;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [outcome, setOutcome] = useState<{ title: string; body: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = flow.questions.length;
  const questionIndex = typeof step === "number" ? step : null;

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
      return json as {
        id: string;
        completed: boolean;
        outcome?: { title: string; body: string };
      };
    } catch {
      setError("Não foi possível salvar sua resposta. Tente novamente.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    if (totalQuestions === 0) {
      const result = await saveProgress({
        name,
        phone,
        currentStep: "outcome",
      });
      if (!result) return;
      if (result.outcome) setOutcome(result.outcome);
      setStep("outcome");
      return;
    }
    const result = await saveProgress({ name, phone, currentStep: "q:0" });
    if (result) setStep(0);
  }

  async function handleAnswer(qIndex: number, optionId: string) {
    const isLast = qIndex === totalQuestions - 1;
    const result = await saveProgress({
      answer: { questionId: flow.questions[qIndex].id, optionId },
      currentStep: isLast ? "outcome" : `q:${qIndex + 1}`,
    });
    if (!result) return;
    if (isLast) {
      if (result.outcome) setOutcome(result.outcome);
      setStep("outcome");
    } else {
      setStep(qIndex + 1);
    }
  }

  return (
    <div className="w-full max-w-md">
      {questionIndex !== null && totalQuestions > 0 && (
        <div className="mb-8 flex gap-1.5">
          {flow.questions.map((q, i) => (
            <div
              key={q.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= questionIndex ? "bg-accent" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {step === "intro" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">{flow.intro.title}</h1>
          <p className="mt-3 text-sm text-white/60">{flow.intro.body}</p>
          <button
            onClick={() => setStep("contact")}
            className="mt-8 w-full rounded-xl bg-accent py-3 font-medium text-black transition hover:opacity-90"
          >
            Começar
          </button>
        </div>
      )}

      {step === "contact" && (
        <form
          onSubmit={handleContactSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
        >
          <h2 className="text-xl font-semibold text-white">{flow.contact.question}</h2>
          <p className="mt-1 text-sm text-white/50">{flow.contact.help}</p>
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

      {questionIndex !== null && (
        <ChoiceStep
          question={flow.questions[questionIndex].question}
          options={flow.questions[questionIndex].options}
          onSelect={(optionId) => handleAnswer(questionIndex, optionId)}
          submitting={submitting}
        />
      )}

      {step === "outcome" && outcome && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-semibold text-white">{outcome.title}</h2>
          <p className="mt-3 text-sm text-white/60">{outcome.body}</p>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
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
        {options.map((opt) => (
          <button
            key={opt.id}
            disabled={submitting}
            onClick={() => onSelect(opt.id)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left text-white transition hover:border-accent hover:bg-white/10 disabled:opacity-40"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
