export type StepOption = {
  id: string;
  label: string;
  /** Tags this answer contributes to the lead's profile. Edges match on these. */
  tags: string[];
};

// ---------------------------------------------------------------------------
// Graph model — a flow is nodes + edges. Leaving any non-outcome node, the
// first outgoing edge whose requiredTags ⊆ accumulated tags wins; the last
// outgoing edge (positionally) is the catch-all fallback.
// ---------------------------------------------------------------------------

export type FlowNode =
  | { id: string; type: "intro"; position: { x: number; y: number }; data: { title: string; body: string } }
  | { id: string; type: "contact"; position: { x: number; y: number }; data: { question: string; help: string } }
  | { id: string; type: "choice"; position: { x: number; y: number }; data: { question: string; options: StepOption[] } }
  | {
      id: string;
      type: "outcome";
      position: { x: number; y: number };
      data: { title: string; body: string; qualified: boolean };
    };

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  /** Empty = unconditional ("sempre") / catch-all edge. */
  requiredTags: string[];
};

export type FlowGraph = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryNodeId: string;
};

export function findNode(graph: FlowGraph, id: string): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

/** Same first-match/last-fallback rule the old matchOutcome used, generalized to every transition. */
export function resolveNextNode(graph: FlowGraph, fromNodeId: string, tags: string[]): FlowEdge | null {
  const outgoing = graph.edges.filter((e) => e.from === fromNodeId);
  if (outgoing.length === 0) return null;
  const tagSet = new Set(tags);
  const match = outgoing.find((e) => e.requiredTags.every((t) => tagSet.has(t)));
  return match ?? outgoing[outgoing.length - 1];
}

export function isFlowGraph(value: unknown): value is FlowGraph {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as FlowGraph).nodes) &&
    Array.isArray((value as FlowGraph).edges) &&
    typeof (value as FlowGraph).entryNodeId === "string"
  );
}

// ---------------------------------------------------------------------------
// Legacy (pre-graph) shape — kept only so migrateLegacyFlowToGraph can read
// whatever's already stored in older FlowConfig rows, and to seed the very
// first default flow.
// ---------------------------------------------------------------------------

export type LegacyQuestionStep = { id: string; question: string; options: StepOption[] };
export type LegacyOutcome = { id: string; title: string; body: string; requiredTags: string[]; qualified: boolean };
export type LegacyFlowSteps = {
  intro: { title: string; body: string };
  contact: { question: string; help: string };
  questions: LegacyQuestionStep[];
  outcomes: LegacyOutcome[];
};

export const DEFAULT_FLOW_STEPS: LegacyFlowSteps = {
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

const NODE_X_GAP = 280;
const OUTCOME_Y_GAP = 160;

/**
 * Converts the old linear questions[]/outcomes[] shape into an equivalent
 * graph, preserving every node id (Lead.answers is keyed by these) and
 * reproducing identical routing: resolveNextNode uses the same
 * first-match/last-fallback rule matchOutcome used, so this is behaviorally
 * inert on day one for any already-collected tag combination.
 */
export function migrateLegacyFlowToGraph(legacy: LegacyFlowSteps): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let edgeSeq = 0;
  const nextEdgeId = () => `e_${edgeSeq++}`;

  nodes.push({
    id: "intro",
    type: "intro",
    position: { x: 0, y: 0 },
    data: { title: legacy.intro.title, body: legacy.intro.body },
  });
  nodes.push({
    id: "contact",
    type: "contact",
    position: { x: NODE_X_GAP, y: 0 },
    data: { question: legacy.contact.question, help: legacy.contact.help },
  });
  edges.push({ id: nextEdgeId(), from: "intro", to: "contact", requiredTags: [] });

  let lastContentNodeId = "contact";
  legacy.questions.forEach((q, i) => {
    nodes.push({
      id: q.id,
      type: "choice",
      position: { x: NODE_X_GAP * (i + 2), y: 0 },
      data: { question: q.question, options: q.options },
    });
    edges.push({ id: nextEdgeId(), from: lastContentNodeId, to: q.id, requiredTags: [] });
    lastContentNodeId = q.id;
  });

  const outcomeX = NODE_X_GAP * (legacy.questions.length + 2);
  legacy.outcomes.forEach((o, i) => {
    nodes.push({
      id: o.id,
      type: "outcome",
      position: { x: outcomeX, y: i * OUTCOME_Y_GAP },
      data: { title: o.title, body: o.body, qualified: o.qualified },
    });
    edges.push({ id: nextEdgeId(), from: lastContentNodeId, to: o.id, requiredTags: o.requiredTags });
  });

  return { nodes, edges, entryNodeId: "intro" };
}
