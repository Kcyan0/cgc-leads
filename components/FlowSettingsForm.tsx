"use client";

import { useId, useState } from "react";
import type { FlowSteps, Outcome, QuestionStep, StepOption } from "@/lib/flow";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function FlowSettingsForm({ initial }: { initial: FlowSteps }) {
  const [flow, setFlow] = useState<FlowSteps>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(flow.questions.flatMap((q) => q.options.flatMap((o) => o.tags)))
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/flow-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow),
      });
      if (!res.ok) throw new Error("failed");
      setSavedAt(Date.now());
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, next: QuestionStep) {
    const questions = [...flow.questions];
    questions[index] = next;
    setFlow({ ...flow, questions });
  }

  function addQuestion() {
    const q: QuestionStep = {
      id: newId("q"),
      question: "Nova pergunta",
      options: [
        { id: newId("opt"), label: "Opção A", tags: [] },
        { id: newId("opt"), label: "Opção B", tags: [] },
      ],
    };
    setFlow({ ...flow, questions: [...flow.questions, q] });
  }

  function removeQuestion(index: number) {
    setFlow({ ...flow, questions: flow.questions.filter((_, i) => i !== index) });
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= flow.questions.length) return;
    const questions = [...flow.questions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    setFlow({ ...flow, questions });
  }

  function updateOutcome(index: number, next: Outcome) {
    const outcomes = [...flow.outcomes];
    outcomes[index] = next;
    setFlow({ ...flow, outcomes });
  }

  function addOutcome() {
    const o: Outcome = {
      id: newId("out"),
      title: "Aplicação recebida",
      body: "Descreva a mensagem final para esse caso.",
      requiredTags: [],
      qualified: false,
    };
    // Insert before the catch-all (last item) so the fallback stays last.
    const outcomes = [...flow.outcomes];
    outcomes.splice(Math.max(outcomes.length - 1, 0), 0, o);
    setFlow({ ...flow, outcomes });
  }

  function removeOutcome(index: number) {
    if (flow.outcomes.length <= 1) return;
    setFlow({ ...flow, outcomes: flow.outcomes.filter((_, i) => i !== index) });
  }

  function moveOutcome(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= flow.outcomes.length) return;
    const outcomes = [...flow.outcomes];
    [outcomes[index], outcomes[target]] = [outcomes[target], outcomes[index]];
    setFlow({ ...flow, outcomes });
  }

  return (
    <div className="space-y-8">
      <Section title="1. Introdução">
        <Field
          label="Título"
          value={flow.intro.title}
          onChange={(v) => setFlow({ ...flow, intro: { ...flow.intro, title: v } })}
        />
        <Field
          label="Texto"
          textarea
          value={flow.intro.body}
          onChange={(v) => setFlow({ ...flow, intro: { ...flow.intro, body: v } })}
        />
      </Section>

      <Section title="2. Nome + telefone">
        <Field
          label="Pergunta"
          value={flow.contact.question}
          onChange={(v) => setFlow({ ...flow, contact: { ...flow.contact, question: v } })}
        />
        <Field
          label="Texto de apoio"
          value={flow.contact.help}
          onChange={(v) => setFlow({ ...flow, contact: { ...flow.contact, help: v } })}
        />
      </Section>

      <Section
        title="3. Perguntas de qualificação"
        hint="Adicione, remova ou reordene perguntas quando precisar mudar o funil — cada opção pode carregar tags, usadas para decidir o resultado final."
      >
        <div className="space-y-4">
          {flow.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              total={flow.questions.length}
              onChange={(next) => updateQuestion(i, next)}
              onRemove={() => removeQuestion(i)}
              onMove={(dir) => moveQuestion(i, dir)}
            />
          ))}
          {flow.questions.length === 0 && (
            <p className="text-sm text-white/40">
              Nenhuma pergunta de qualificação — o formulário vai direto de contato para o
              resultado.
            </p>
          )}
        </div>
        <button
          onClick={addQuestion}
          className="mt-4 rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white hover:text-white"
        >
          + Adicionar pergunta
        </button>
      </Section>

      <Section
        title="4. Resultados finais"
        hint="Cada resultado é aplicado se o lead tiver TODAS as tags exigidas. São checados na ordem abaixo, de cima para baixo — o último funciona como padrão (deixe sem tags exigidas)."
      >
        <div className="space-y-4">
          {flow.outcomes.map((o, i) => (
            <OutcomeEditor
              key={o.id}
              outcome={o}
              index={i}
              total={flow.outcomes.length}
              availableTags={allTags}
              isFallback={i === flow.outcomes.length - 1}
              onChange={(next) => updateOutcome(i, next)}
              onRemove={() => removeOutcome(i)}
              onMove={(dir) => moveOutcome(i, dir)}
            />
          ))}
        </div>
        <button
          onClick={addOutcome}
          className="mt-4 rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white hover:text-white"
        >
          + Adicionar resultado
        </button>
      </Section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-accent px-6 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
        {savedAt && <span className="text-sm text-white/60">Salvo!</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: QuestionStep;
  index: number;
  total: number;
  onChange: (next: QuestionStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  function updateOption(i: number, next: StepOption) {
    const options = [...question.options];
    options[i] = next;
    onChange({ ...question, options });
  }

  function addOption() {
    onChange({
      ...question,
      options: [...question.options, { id: newId("opt"), label: "Nova opção", tags: [] }],
    });
  }

  function removeOption(i: number) {
    if (question.options.length <= 1) return;
    onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="mt-2.5 shrink-0 text-xs font-medium text-white/30">
          Pergunta {index + 1}
        </span>
        <div className="flex-1">
          <Field label="Texto da pergunta" value={question.question} onChange={(v) => onChange({ ...question, question: v })} />
        </div>
        <ReorderControls index={index} total={total} onMove={onMove} onRemove={onRemove} />
      </div>

      <div className="mt-3 space-y-2 pl-0">
        <span className="block text-xs font-medium text-white/40">Opções e tags</span>
        {question.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              value={opt.label}
              onChange={(e) => updateOption(i, { ...opt, label: e.target.value })}
              placeholder="Texto da opção"
              className="w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
            />
            <input
              value={opt.tags.join(", ")}
              onChange={(e) =>
                updateOption(i, {
                  ...opt,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="tags (ex: qualificado, cliente)"
              className="w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/70 outline-none focus:border-accent"
            />
            <button
              onClick={() => removeOption(i)}
              disabled={question.options.length <= 1}
              className="shrink-0 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-white/40 transition hover:text-white disabled:opacity-30"
              aria-label="Remover opção"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="text-xs font-medium text-white/40 underline underline-offset-2 hover:text-white"
        >
          + Adicionar opção
        </button>
      </div>
    </div>
  );
}

function OutcomeEditor({
  outcome,
  index,
  total,
  availableTags,
  isFallback,
  onChange,
  onRemove,
  onMove,
}: {
  outcome: Outcome;
  index: number;
  total: number;
  availableTags: string[];
  isFallback: boolean;
  onChange: (next: Outcome) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const inputId = useId();

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="mt-1 shrink-0 text-xs font-medium uppercase tracking-wide text-white/40">
          {isFallback ? "Padrão (sem match)" : `Resultado ${index + 1}`}
        </p>
        <ReorderControls
          index={index}
          total={total}
          onMove={onMove}
          onRemove={onRemove}
          removeDisabled={total <= 1}
        />
      </div>

      <div className="mt-2 space-y-3">
        <Field label="Título" value={outcome.title} onChange={(v) => onChange({ ...outcome, title: v })} />
        <Field
          label="Texto"
          textarea
          value={outcome.body}
          onChange={(v) => onChange({ ...outcome, body: v })}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/40">
            Tags exigidas {isFallback && "(deixe vazio — é o padrão)"}
          </span>
          <input
            value={outcome.requiredTags.join(", ")}
            onChange={(e) =>
              onChange({
                ...outcome,
                requiredTags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder={availableTags.length ? `ex: ${availableTags.slice(0, 3).join(", ")}` : "ex: qualificado, cliente"}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
          />
        </label>
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm text-white/70">
          <input
            id={inputId}
            type="checkbox"
            checked={outcome.qualified}
            onChange={(e) => onChange({ ...outcome, qualified: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-white"
          />
          Marca o lead como qualificado (hot)
        </label>
      </div>
    </div>
  );
}

function ReorderControls({
  index,
  total,
  onMove,
  onRemove,
  removeDisabled,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  removeDisabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/50 transition hover:text-white disabled:opacity-20"
        aria-label="Mover para cima"
      >
        ↑
      </button>
      <button
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/50 transition hover:text-white disabled:opacity-20"
        aria-label="Mover para baixo"
      >
        ↓
      </button>
      <button
        onClick={onRemove}
        disabled={removeDisabled}
        className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/40 transition hover:text-white disabled:opacity-20"
        aria-label="Remover"
      >
        ✕
      </button>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
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
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
        />
      )}
    </label>
  );
}
