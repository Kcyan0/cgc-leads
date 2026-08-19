import { NextResponse } from "next/server";
import { publishDraftGraph } from "@/lib/flow-db";

export async function POST() {
  const published = await publishDraftGraph();
  return NextResponse.json({ ok: true, published });
}
