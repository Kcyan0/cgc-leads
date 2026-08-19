import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { saveFlowConfig, type FlowSteps } from "@/lib/flow";

export async function PUT(request: NextRequest) {
  let body: FlowSteps;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (
    !body?.intro ||
    !body?.contact ||
    !Array.isArray(body?.questions) ||
    !Array.isArray(body?.outcomes) ||
    body.outcomes.length === 0
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await saveFlowConfig(body);
  return NextResponse.json({ ok: true });
}
