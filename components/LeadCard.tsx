"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";

export type LeadCardData = {
  id: string;
  index: number;
  name: string | null;
  phone: string | null;
  status: string;
  contacted: boolean;
  qualified: boolean | null;
  answerLabels: string[];
  origin: string | null;
  createdAtLabel: string;
};

export default function LeadCard({ lead }: { lead: LeadCardData }) {
  const [contacted, setContacted] = useState(lead.contacted);
  const [saving, setSaving] = useState(false);

  async function toggleContacted() {
    setSaving(true);
    const next = !contacted;
    setContacted(next);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: next }),
      });
      if (!res.ok) setContacted(!next);
    } catch {
      setContacted(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-white/30">#{lead.index}</span>
            <h3 className="truncate text-lg font-semibold text-white">
              {lead.name || "Sem nome"}
            </h3>
          </div>
          <p className="mt-0.5 text-sm text-white/40">
            {lead.status === "hot" ? "Hot" : "Frio"}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {lead.qualified === true && <Badge solid>Qualificado</Badge>}
            {lead.qualified === false && <Badge>Não qualificado</Badge>}
            {lead.answerLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
            {lead.origin && <Badge>Origem: {lead.origin}</Badge>}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
            🕐 {lead.createdAtLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {lead.phone && (
            <a
              href={whatsappLink(lead.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-accent px-5 py-2.5 text-center text-sm font-medium text-black transition hover:opacity-90"
            >
              WhatsApp
            </a>
          )}
          <button
            onClick={toggleContacted}
            disabled={saving}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
              contacted
                ? "bg-white text-black"
                : "border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {contacted ? "✓ Contatado" : "Marcar contatado"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        solid ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/50"
      }`}
    >
      {children}
    </span>
  );
}
