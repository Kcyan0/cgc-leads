import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-2xl font-semibold text-white">
        CGC <span className="underline decoration-2 underline-offset-4">Leads</span>
      </h1>
      <div className="flex gap-3">
        <Link
          href="/aplicacao"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black hover:opacity-90"
        >
          Ver formulário
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white"
        >
          Painel admin
        </Link>
      </div>
    </main>
  );
}
