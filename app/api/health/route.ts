import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";

  const checks: {
    database: "ok" | "error";
    observabilityEvents: "ok" | "error";
    visitTracking: "ok" | "degraded";
  } = {
    database: "ok",
    observabilityEvents: "ok",
    visitTracking: "degraded",
  };

  const metrics = {
    cadastrosTotal: 0,
    cadastros24h: 0,
    visitasTotal: 0,
    visitas24h: 0,
    topPaginas24h: [] as Array<{ path: string; visitas24h: number }>,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;

    try {
      const cadastroRows = await prisma.$queryRaw<
        Array<{
          cadastros_total: number;
          cadastros_24h: number;
        }>
      >`
        SELECT
          (
            COALESCE((SELECT COUNT(*)::int FROM pontos_coleta), 0) +
            COALESCE((SELECT COUNT(*)::int FROM pedidos_ajuda), 0) +
            COALESCE((SELECT COUNT(*)::int FROM encontrar_pessoas), 0) +
            COALESCE((SELECT COUNT(*)::int FROM encontrar_animais), 0)
          )::int AS cadastros_total,
          (
            COALESCE((SELECT COUNT(*)::int FROM pontos_coleta WHERE criado_em >= now() - interval '24 hours'), 0) +
            COALESCE((SELECT COUNT(*)::int FROM pedidos_ajuda WHERE criado_em >= now() - interval '24 hours'), 0) +
            COALESCE((SELECT COUNT(*)::int FROM encontrar_pessoas WHERE criado_em >= now() - interval '24 hours'), 0) +
            COALESCE((SELECT COUNT(*)::int FROM encontrar_animais WHERE criado_em >= now() - interval '24 hours'), 0)
          )::int AS cadastros_24h
      `;

      const cadastro = cadastroRows[0];
      if (cadastro) {
        metrics.cadastrosTotal = cadastro.cadastros_total ?? 0;
        metrics.cadastros24h = cadastro.cadastros_24h ?? 0;
      }
    } catch {
      checks.observabilityEvents = "error";
    }

    try {
      const visitasRows = await prisma.$queryRaw<
        Array<{
          visitas_total: number;
          visitas_24h: number;
        }>
      >`
        SELECT
          COUNT(*)::int AS visitas_total,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS visitas_24h
        FROM observability_events
        WHERE event_type = 'page_view'
          AND NOT (
            COALESCE((metadata->>'isBot')::boolean, false)
            OR COALESCE(metadata->>'userAgent', '') ~* '(bot|spider|crawler|headless|facebookexternalhit|slurp|bingpreview|pingdom|uptimerobot)'
          )
      `;

      metrics.visitasTotal = visitasRows[0]?.visitas_total ?? 0;
      metrics.visitas24h = visitasRows[0]?.visitas_24h ?? 0;

      const topPaginasRows = await prisma.$queryRaw<
        Array<{
          path: string;
          visitas_24h: number;
        }>
      >`
        SELECT
          COALESCE(metadata->>'path', '/') AS path,
          COUNT(*)::int AS visitas_24h
        FROM observability_events
        WHERE event_type = 'page_view'
          AND created_at >= now() - interval '24 hours'
          AND NOT (
            COALESCE((metadata->>'isBot')::boolean, false)
            OR COALESCE(metadata->>'userAgent', '') ~* '(bot|spider|crawler|headless|facebookexternalhit|slurp|bingpreview|pingdom|uptimerobot)'
          )
        GROUP BY 1
        ORDER BY visitas_24h DESC, path ASC
        LIMIT 10
      `;

      metrics.topPaginas24h = topPaginasRows.map((item) => ({
        path: item.path,
        visitas24h: item.visitas_24h,
      }));
      checks.visitTracking = "ok";
    } catch {
      checks.observabilityEvents = "error";
      checks.visitTracking = "degraded";
    }

    return NextResponse.json(
      {
        status: "ok",
        service: "ondedoar.io",
        environment,
        version,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        checks,
        metrics,
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch {
    checks.database = "error";
    return NextResponse.json(
      {
        status: "degraded",
        service: "ondedoar.io",
        environment,
        version,
        timestamp: new Date().toISOString(),
        checks,
        metrics,
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
