import Link from "next/link";
import { prisma } from "@/lib/db";
import { getFlowConfig } from "@/lib/flow";
import StatCard from "@/components/StatCard";
import FilterBar from "@/components/FilterBar";
import LeadCard, { type LeadCardData } from "@/components/LeadCard";
import LogoutButton from "@/components/LogoutButton";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    contato?: string;
    periodo?: string;
  }>;
}) {
  const { q, categoria, contato, periodo } = await searchParams;
  const flow = await getFlowConfig();
  const questionById = new Map(flow.questions.map((qs) => [qs.id, qs]));

  const where: Prisma.LeadWhereInput = { completed: true };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { origin: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoria === "qualificados") where.qualified = true;
  if (categoria === "nao_qualificados") where.qualified = false;
  if (contato === "chamados") where.contacted = true;
  if (contato === "nao_chamados") where.contacted = false;
  if (periodo === "hoje") where.createdAt = { gte: startOfDay(0) };
  if (periodo === "ontem")
    where.createdAt = { gte: startOfDay(-1), lt: startOfDay(0) };
  if (periodo === "7dias") where.createdAt = { gte: startOfDay(-7) };

  const [leads, total, hoje, hot, naoContatados] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.lead.count({ where: { completed: true } }),
    prisma.lead.count({ where: { completed: true, createdAt: { gte: startOfDay(0) } } }),
    prisma.lead.count({ where: { completed: true, status: "hot" } }),
    prisma.lead.count({ where: { completed: true, contacted: false } }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cards: LeadCardData[] = leads.map((lead, i) => {
    const answers = (lead.answers as Record<string, { optionId: string; label: string }>) ?? {};
    const answerLabels = flow.questions
      .filter((qs) => answers[qs.id])
      .map((qs) => `${questionById.get(qs.id)?.question ?? qs.question}: ${answers[qs.id].label}`);

    return {
      id: lead.id,
      index: i + 1,
      name: lead.name,
      phone: lead.phone,
      status: lead.status,
      contacted: lead.contacted,
      qualified: lead.qualified,
      answerLabels,
      origin: lead.origin,
      createdAtLabel: dateFormatter.format(lead.createdAt),
    };
  });

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            CGC <span className="underline decoration-2 underline-offset-4">Leads</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/fluxo"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              Fluxo
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={total} />
          <StatCard label="Hoje" value={hoje} />
          <StatCard label="Hot" value={hot} emphasis />
          <StatCard label="Não contatados" value={naoContatados} />
        </div>

        <div className="mt-8">
          <FilterBar total={leads.length} />
        </div>

        <div className="mt-6 space-y-4">
          {cards.length === 0 && (
            <p className="py-16 text-center text-white/40">
              Nenhum lead encontrado com esses filtros.
            </p>
          )}
          {cards.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </div>
    </main>
  );
}
