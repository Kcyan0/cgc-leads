"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Algo deu errado</h1>
        <p className="mt-3 text-sm text-white/60">
          A página não conseguiu carregar. Se isso acontecer logo após configurar o projeto,
          confira se <code className="rounded bg-white/10 px-1.5 py-0.5">DATABASE_URL</code>{" "}
          está definido em <code className="rounded bg-white/10 px-1.5 py-0.5">.env</code> e se
          as migrações já rodaram (<code className="rounded bg-white/10 px-1.5 py-0.5">
            npx prisma migrate dev
          </code>).
        </p>
        {error.message && (
          <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-left text-xs text-white/40">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 w-full rounded-xl bg-accent py-3 font-medium text-black transition hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
