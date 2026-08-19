import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { FlowGraph } from "@/lib/flow";
import { saveDraftGraph } from "@/lib/flow-db";

function isValidGraph(body: unknown): body is FlowGraph {
  if (!body || typeof body !== "object") return false;
  const graph = body as FlowGraph;
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
  if (typeof graph.entryNodeId !== "string") return false;

  const introNodes = graph.nodes.filter((n) => n.type === "intro");
  const outcomeNodes = graph.nodes.filter((n) => n.type === "outcome");
  if (introNodes.length !== 1) return false;
  if (outcomeNodes.length < 1) return false;

  const nonOutcomeIds = graph.nodes.filter((n) => n.type !== "outcome").map((n) => n.id);
  const nodesWithOutgoing = new Set(graph.edges.map((e) => e.from));
  if (!nonOutcomeIds.every((id) => nodesWithOutgoing.has(id))) return false;

  return true;
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!isValidGraph(body)) {
    return NextResponse.json(
      { error: "invalid graph: needs exactly one intro node, at least one outcome node, and every other node needs an outgoing connection" },
      { status: 400 }
    );
  }

  await saveDraftGraph(body);
  return NextResponse.json({ ok: true });
}
