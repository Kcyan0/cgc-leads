"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "qualificados", label: "Qualificados" },
  { value: "nao_qualificados", label: "Não qualificados" },
];

const CONTACT_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "nao_chamados", label: "Não chamados" },
  { value: "chamados", label: "Chamados" },
];

const DATE_OPTIONS = [
  { value: "tudo", label: "Tudo" },
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7dias", label: "7 dias" },
];

export default function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === "todos" || value === "tudo") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (q !== (searchParams.get("q") ?? "")) setParam("q", q);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = searchParams.get("categoria") ?? "todos";
  const contact = searchParams.get("contato") ?? "todos";
  const date = searchParams.get("periodo") ?? "tudo";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nome, telefone ou origem..."
          className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-accent"
        />
        <Pills
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => setParam("categoria", v)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Pills
          options={CONTACT_OPTIONS}
          value={contact}
          onChange={(v) => setParam("contato", v)}
        />
        <Pills
          options={DATE_OPTIONS}
          value={date}
          onChange={(v) => setParam("periodo", v)}
        />
        <span className="ml-auto text-sm text-white/40">{total} resultados</span>
      </div>
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            value === opt.value
              ? "bg-accent text-black"
              : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
