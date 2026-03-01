import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let serviceStatus: "ok" | "degraded" = "degraded";
  let databaseStatus: "ok" | "error" = "error";
  let environment = "unknown";
  let version = "unknown";
  let responseTimeMs = 0;
  let cadastrosTotal = 0;
  let cadastros24h = 0;
  let visitasTotal = 0;
  let visitas24h = 0;

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";

  try {
    const response = await fetch(`${protocol}://${host}/api/health`, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as {
        status?: "ok" | "degraded";
        environment?: string;
        version?: string;
        checks?: {
          database?: "ok" | "error";
        };
        metrics?: {
          cadastrosTotal?: number;
          cadastros24h?: number;
          visitasTotal?: number;
          visitas24h?: number;
        };
        responseTimeMs?: number;
      };

      serviceStatus = data.status ?? "degraded";
      environment = data.environment ?? "unknown";
      version = data.version ?? "unknown";
      databaseStatus = data.checks?.database ?? "error";
      responseTimeMs = Number(data.responseTimeMs ?? 0);
      cadastrosTotal = Number(data.metrics?.cadastrosTotal ?? 0);
      cadastros24h = Number(data.metrics?.cadastros24h ?? 0);
      visitasTotal = Number(data.metrics?.visitasTotal ?? 0);
      visitas24h = Number(data.metrics?.visitas24h ?? 0);
    }
  } catch {
    serviceStatus = "degraded";
    databaseStatus = "error";
    environment = "unknown";
    version = "unknown";
    responseTimeMs = 0;
    cadastrosTotal = 0;
    cadastros24h = 0;
    visitasTotal = 0;
    visitas24h = 0;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-800">Healthcheck</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                serviceStatus === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {serviceStatus.toUpperCase()}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Status técnico do serviço sem JSON bruto.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Serviço</p>
              <p className="font-bold text-slate-800">ondedoar.io</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Banco</p>
              <p
                className={`font-bold ${
                  databaseStatus === "ok" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {databaseStatus}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Resposta</p>
              <p className="font-bold text-slate-800">{responseTimeMs} ms</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">
                Cadastros total
              </p>
              <p className="font-extrabold text-slate-800 text-xl">
                {cadastrosTotal}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Cadastros 24h</p>
              <p className="font-extrabold text-slate-800 text-xl">
                {cadastros24h}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Visitas total</p>
              <p className="font-extrabold text-slate-800 text-xl">
                {visitasTotal}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">Visitas 24h</p>
              <p className="font-extrabold text-slate-800 text-xl">
                {visitas24h}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase text-slate-500">
                Ambiente / versão
              </p>
              <p className="font-bold text-slate-700 text-xs mt-1">
                {environment} · {version}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              Voltar para Home
            </Link>
            <a
              href="/api/health"
              className="inline-flex bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-blue-200"
            >
              Ver JSON técnico
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
