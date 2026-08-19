import Link from "next/link";
import { getFlowConfig } from "@/lib/flow";
import FlowSettingsForm from "@/components/FlowSettingsForm";

export const dynamic = "force-dynamic";

export default async function FluxoPage() {
  const flow = await getFlowConfig();

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-white/40 hover:text-white">
              ← Leads
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-white">Editor de Fluxo</h1>
            <p className="mt-1 text-sm text-white/50">
              Edite as perguntas e mensagens do formulário público em{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5">/aplicacao</code>.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <FlowSettingsForm initial={flow} />
        </div>
      </div>
    </main>
  );
}
