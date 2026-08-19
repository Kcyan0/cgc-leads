import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { findNode, resolveNextNode, type FlowNode } from "@/lib/flow";
import { getPublishedGraph } from "@/lib/flow-db";
import type { Prisma } from "@/app/generated/prisma/client";

type VisitedEntry = { nodeId: string; at: string };

function appendVisited(visited: VisitedEntry[], nodeId: string): VisitedEntry[] {
  const last = visited[visited.length - 1];
  if (last && last.nodeId === nodeId) return visited;
  return [...visited, { nodeId, at: new Date().toISOString() }];
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { id, origin, name, phone, currentNodeId, optionId } = body ?? {};

  if (typeof currentNodeId !== "string" || !currentNodeId) {
    return NextResponse.json({ error: "missing currentNodeId" }, { status: 400 });
  }

  const graph = await getPublishedGraph();
  const currentNode = findNode(graph, currentNodeId);
  if (!currentNode || currentNode.type === "outcome") {
    return NextResponse.json({ error: "invalid currentNodeId" }, { status: 400 });
  }

  const existing =
    typeof id === "string" && id ? await prisma.lead.findUnique({ where: { id } }) : null;

  const data: Prisma.LeadUpdateInput = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 200);
  if (typeof phone === "string" && phone.trim()) data.phone = phone.trim().slice(0, 40);
  if (!existing && typeof origin === "string" && origin.trim())
    data.origin = origin.trim().slice(0, 60);

  let tags: string[] = Array.isArray(existing?.tags) ? [...existing.tags] : [];
  let answers = (existing?.answers as Record<string, { optionId: string; label: string }>) ?? {};

  if (currentNode.type === "choice" && typeof optionId === "string") {
    const option = currentNode.data.options.find((o) => o.id === optionId);
    if (option) {
      answers = { ...answers, [currentNode.id]: { optionId: option.id, label: option.label } };
      tags = Array.from(new Set([...tags, ...option.tags]));
      data.answers = answers;
      data.tags = { set: tags };
    }
  }

  const edge = resolveNextNode(graph, currentNode.id, tags);
  if (!edge) {
    return NextResponse.json({ error: "flow has no path from this node" }, { status: 500 });
  }
  const nextNode = findNode(graph, edge.to) as FlowNode;

  let visited: VisitedEntry[] = Array.isArray(existing?.visited)
    ? (existing.visited as unknown as VisitedEntry[])
    : [];
  visited = appendVisited(visited, currentNode.id);
  visited = appendVisited(visited, nextNode.id);
  data.visited = visited;

  let outcome: { id: string; title: string; body: string } | undefined;
  if (nextNode.type === "outcome") {
    data.completed = true;
    data.qualified = nextNode.data.qualified;
    data.status = nextNode.data.qualified ? "hot" : "frio";
    data.outcomeId = nextNode.id;
    outcome = { id: nextNode.id, title: nextNode.data.title, body: nextNode.data.body };
  }

  const lead = existing
    ? await prisma.lead.update({ where: { id: existing.id }, data })
    : await prisma.lead.create({ data: data as Prisma.LeadCreateInput });

  return NextResponse.json({ id: lead.id, nextNode, outcome });
}
