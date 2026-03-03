import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureObservabilityInfra } from "@/lib/observability";

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /bot|spider|crawler|headless|facebookexternalhit|slurp|bingpreview|pingdom|uptimerobot/i.test(
    userAgent,
  );
}

export async function POST(request: NextRequest) {
  try {
    await ensureObservabilityInfra();

    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
    };

    const path =
      typeof body.path === "string" && body.path.length > 0
        ? body.path.slice(0, 200)
        : "/";

    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
    const isBot = isBotUserAgent(userAgent);

    await prisma.$executeRaw`
      INSERT INTO observability_events (
        source,
        event_type,
        level,
        message,
        metadata
      ) VALUES (
        'web',
        'page_view',
        'INFO',
        'Visualização de página registrada.',
        ${JSON.stringify({ path, userAgent, isBot })}::jsonb
      )
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
