import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { isVerifiedAdminEmail } from "@/lib/admin";
import { ensureObservabilityInfra } from "@/lib/observability";
import FlashMessage from "@/components/FlashMessage";
import {
  gerarEventoTesteObservabilidade,
  limparEventosTesteObservabilidade,
} from "@/app/actions/observabilidade";

interface AdminObservabilidadePageProps {
  searchParams?:
    | Promise<{ success?: string | string[]; error?: string | string[] }>
    | { success?: string | string[]; error?: string | string[] };
}

function normalizeParam(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v.trim() || undefined;
}

type EventRow = {
  id: string;
  source: string;
  event_type: string;
  level: string;
  message: string;
  user_email: string | null;
  metadata: unknown;
  created_at: Date;
};

export default async function AdminObservabilidadePage(
  props: AdminObservabilidadePageProps,
) {
  const session = await getServerSession(authOptions);

  const rawSearchParams = (await (props.searchParams ?? {})) as {
    success?: string | string[];
    error?: string | string[];
  };
  const success = normalizeParam(rawSearchParams.success);
  const error = normalizeParam(rawSearchParams.error);

  if (
    !session?.user?.email ||
    !(await isVerifiedAdminEmail(session.user.email))
  ) {
    redirect("/");
  }

  await ensureObservabilityInfra();

  const [resumoRows, errosRows, recentes] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        total_24h: bigint;
        erros_24h: bigint;
        fontes_24h: bigint;
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS total_24h,
        COUNT(*) FILTER (
          WHERE created_at >= now() - interval '24 hours'
            AND level = 'ERROR'
        ) AS erros_24h,
        COUNT(DISTINCT source) FILTER (WHERE created_at >= now() - interval '24 hours') AS fontes_24h
      FROM observability_events
    `,
    prisma.$queryRaw<
      Array<{
        source: string;
        total: bigint;
      }>
    >`
      SELECT source, COUNT(*) AS total
      FROM observability_events
      WHERE level = 'ERROR'
        AND created_at >= now() - interval '24 hours'
      GROUP BY source
      ORDER BY total DESC
      LIMIT 5
    `,
    prisma.$queryRaw<EventRow[]>`
      SELECT id, source, event_type, level, message, user_email, metadata, created_at
      FROM observability_events
      ORDER BY created_at DESC
      LIMIT 50
    `,
  ]);

  const resumo = resumoRows[0] || {
    total_24h: BigInt(0),
    erros_24h: BigInt(0),
    fontes_24h: BigInt(0),
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      {success === "seed" && (
        <FlashMessage
          type="success"
          text="Eventos de teste gerados com sucesso."
        />
      )}
      {success === "cleared" && (
        <FlashMessage
          type="success"
          text="Eventos de teste removidos com sucesso."
        />
      )}
      {error && (
        <FlashMessage
          type="error"
          text="Não foi possível concluir a ação de observabilidade."
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Admin
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="inline-flex bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            Abrir Healthcheck
          </Link>
        </div>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <form action={gerarEventoTesteObservabilidade}>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                Gerar evento de teste
              </button>
            </form>
            <form action={limparEventosTesteObservabilidade}>
              <button
                type="submit"
                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                Limpar eventos de teste
              </button>
            </form>
          </div>
        </section>

        <header className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-3xl font-bold text-slate-900">Observabilidade</h1>
          <p className="text-slate-500 mt-1">
            Monitoramento operacional da plataforma nas últimas 24 horas.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Eventos 24h
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {Number(resumo.total_24h).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Erros 24h
            </p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {Number(resumo.erros_24h).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Fontes ativas
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {Number(resumo.fontes_24h).toLocaleString("pt-BR")}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              Top erros por origem (24h)
            </h2>
            {errosRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sem erros registrados no período.
              </p>
            ) : (
              <ul className="space-y-2">
                {errosRows.map((row) => (
                  <li
                    key={row.source}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-semibold text-slate-700">
                      {row.source}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                      {Number(row.total).toLocaleString("pt-BR")} erros
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Como usar</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Verifique o endpoint de health em monitores externos.</li>
              <li>
                • Acompanhe variação de erros por origem para triagem rápida.
              </li>
              <li>
                • Use os eventos recentes para diagnóstico e auditoria
                operacional.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Últimos eventos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Quando
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Nível
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Origem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Evento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Mensagem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {recentes.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          row.level === "ERROR"
                            ? "inline-flex px-2 py-1 rounded-full font-semibold bg-red-50 text-red-700 border border-red-100"
                            : row.level === "WARN"
                              ? "inline-flex px-2 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-100"
                              : "inline-flex px-2 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }
                      >
                        {row.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {row.source}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {row.event_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 min-w-[320px]">
                      {row.message}
                      {row.user_email ? (
                        <span className="block text-xs text-slate-500 mt-1">
                          usuário: {row.user_email}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
