import { prisma } from "@/lib/db";

export type StepOption = {
  id: string;
  label: string;
  /** Tags this answer contributes to the lead's profile. Outcomes match on these. */
  tags: string[];
};

export type QuestionStep = {
  id: string;
  question: string;
  options: StepOption[];
};

export type Outcome = {
  id: string;
  title: string;
  body: string;
  /** Outcome applies when the lead's collected tags include ALL of these. Empty = catch-all. */
  requiredTags: string[];
  qualified: boolean;
};

export type FlowSteps = {
  intro: { title: string; body: string };
  contact: { question: string; help: string };
  /** Ordered qualifying questions — add, remove, reorder freely, no code changes needed. */
  questions: QuestionStep[];
  /** Checked top to bottom; first outcome whose requiredTags are all present wins. */
  outcomes: Outcome[];
};

/** First outcome whose requiredTags ⊆ tags wins; falls back to the last outcome (catch-all). */
export function matchOutcome(outcomes: Outcome[], tags: string[]): Outcome {
  const tagSet = new Set(tags);
  const match = outcomes.find((o) => o.requiredTags.every((t) => tagSet.has(t)));
  return match ?? outcomes[outcomes.length - 1];
}

export const DEFAULT_FLOW_STEPS: FlowSteps = {
  intro: {
    title: "Aplicação para CGC",
    body: "Leva menos de 2 minutos. Uma pergunta por vez.",
  },
  contact: {
    question: "Qual seu nome e telefone?",
    help: "Preencha seus dados para contato.",
  },
  questions: [
    {
      id: "ja_cliente",
      question: "Você já é cliente CGC hoje?",
      options: [
        { id: "sim", label: "Sim", tags: ["cliente"] },
        { id: "nao", label: "Não", tags: ["novo"] },
      ],
    },
    {
      id: "capital",
      question: "Quanto de capital você tem disponível hoje?",
      options: [
        { id: "menos_500", label: "Menos de R$500", tags: ["sem_capital"] },
        { id: "600_2000", label: "R$600 a R$2.000", tags: ["qualificado"] },
        { id: "5000_10000", label: "R$5.000 a R$10.000", tags: ["qualificado"] },
        { id: "acima_10000", label: "Acima de R$10.000", tags: ["qualificado"] },
      ],
    },
  ],
  outcomes: [
    {
      id: "cliente_qualificado",
      title: "Aplicação recebida",
      body: "Você já é cliente CGC e está qualificado. Em breve entraremos em contato pelo WhatsApp.",
      requiredTags: ["cliente", "qualificado"],
      qualified: true,
    },
    {
      id: "cliente_sem_capital",
      title: "Aplicação recebida",
      body: "Você já é cliente CGC. Vamos avaliar seu caso e retornar pelo WhatsApp.",
      requiredTags: ["cliente", "sem_capital"],
      qualified: false,
    },
    {
      id: "novo_qualificado",
      title: "Aplicação recebida",
      body: "Você é novo por aqui e está qualificado para participar. Em breve entraremos em contato pelo WhatsApp.",
      requiredTags: ["novo", "qualificado"],
      qualified: true,
    },
    {
      id: "padrao",
      title: "Aplicação recebida",
      body: "Recebemos sua aplicação. Vamos avaliar seu caso e retornar pelo WhatsApp.",
      requiredTags: [],
      qualified: false,
    },
  ],
};

export async function getFlowConfig(): Promise<FlowSteps> {
  const row = await prisma.flowConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", steps: DEFAULT_FLOW_STEPS },
  });
  return row.steps as unknown as FlowSteps;
}

export async function saveFlowConfig(steps: FlowSteps): Promise<void> {
  await prisma.flowConfig.upsert({
    where: { id: "default" },
    update: { steps },
    create: { id: "default", steps },
  });
}
