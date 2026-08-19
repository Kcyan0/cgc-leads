import { prisma } from "@/lib/db";
import {
  DEFAULT_FLOW_STEPS,
  isFlowGraph,
  migrateLegacyFlowToGraph,
  type FlowGraph,
  type LegacyFlowSteps,
} from "@/lib/flow";

async function getOrCreateRow() {
  return prisma.flowConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", steps: migrateLegacyFlowToGraph(DEFAULT_FLOW_STEPS) },
  });
}

/** The live graph the public /aplicacao form runs against. Self-migrates a legacy row on first read. */
export async function getPublishedGraph(): Promise<FlowGraph> {
  const row = await getOrCreateRow();
  const stored = row.steps as unknown;
  if (isFlowGraph(stored)) return stored;
  const migrated = migrateLegacyFlowToGraph(stored as LegacyFlowSteps);
  await prisma.flowConfig.update({ where: { id: "default" }, data: { steps: migrated } });
  return migrated;
}

/** The editor's working copy. Falls back to the published graph until the first explicit save. */
export async function getDraftGraph(): Promise<FlowGraph> {
  const row = await getOrCreateRow();
  if (row.draft && isFlowGraph(row.draft)) return row.draft;
  return getPublishedGraph();
}

export async function saveDraftGraph(graph: FlowGraph): Promise<void> {
  await prisma.flowConfig.upsert({
    where: { id: "default" },
    update: { draft: graph },
    create: { id: "default", steps: migrateLegacyFlowToGraph(DEFAULT_FLOW_STEPS), draft: graph },
  });
}

/** Copies the current draft over the published graph. Draft is left in place for continued editing. */
export async function publishDraftGraph(): Promise<FlowGraph> {
  const row = await getOrCreateRow();
  const draft = row.draft && isFlowGraph(row.draft) ? row.draft : await getPublishedGraph();
  await prisma.flowConfig.update({ where: { id: "default" }, data: { steps: draft } });
  return draft;
}
