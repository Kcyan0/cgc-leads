import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFlowConfig, matchOutcome } from "@/lib/flow";
import type { Prisma } from "@/app/generated/prisma/client";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { id, origin, name, phone, answer, currentStep } = body ?? {};

  const existing =
    typeof id === "string" && id
      ? await prisma.lead.findUnique({ where: { id } })
      : null;

  const data: Prisma.LeadUpdateInput = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 200);
  if (typeof phone === "string" && phone.trim()) data.phone = phone.trim().slice(0, 40);
  if (!existing && typeof origin === "string" && origin.trim())
    data.origin = origin.trim().slice(0, 60);
  if (typeof currentStep === "string") data.currentStep = currentStep.slice(0, 40);

  let tags: string[] = Array.isArray(existing?.tags) ? [...existing.tags] : [];
  let answers = (existing?.answers as Record<string, { optionId: string; label: string }>) ?? {};

  if (
    answer &&
    typeof answer === "object" &&
    typeof (answer as Record<string, unknown>).questionId === "string" &&
    typeof (answer as Record<string, unknown>).optionId === "string"
  ) {
    const { questionId, optionId } = answer as { questionId: string; optionId: string };
    const flow = await getFlowConfig();
    const question = flow.questions.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.id === optionId);
    if (question && option) {
      answers = { ...answers, [question.id]: { optionId: option.id, label: option.label } };
      tags = Array.from(new Set([...tags, ...option.tags]));
      data.answers = answers;
      data.tags = { set: tags };
    }
  }

  let outcome: { id: string; title: string; body: string } | undefined;
  if (currentStep === "outcome") {
    const flow = await getFlowConfig();
    const matched = matchOutcome(flow.outcomes, tags);
    data.completed = true;
    data.qualified = matched.qualified;
    data.status = matched.qualified ? "hot" : "frio";
    data.outcomeId = matched.id;
    outcome = { id: matched.id, title: matched.title, body: matched.body };
  }

  if (!existing && Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 400 });
  }

  const lead = existing
    ? await prisma.lead.update({ where: { id: existing.id }, data })
    : await prisma.lead.create({ data: data as Prisma.LeadCreateInput });

  return NextResponse.json({ id: lead.id, completed: lead.completed, outcome });
}
