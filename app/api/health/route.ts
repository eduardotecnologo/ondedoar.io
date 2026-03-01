import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        service: "ondedoar.io",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        checks: {
          database: "ok",
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "ondedoar.io",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
