import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureObservabilityInfra } from "@/lib/observability";

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
        ${JSON.stringify({ path, userAgent })}::jsonb
      )
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
