import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.contacted === "boolean") data.contacted = body.contacted;
  if (typeof body.status === "string") data.status = body.status.slice(0, 20);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 400 });
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ ok: true, lead });
}
