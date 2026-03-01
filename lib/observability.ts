import prisma from "@/lib/prisma";

export type ObservabilityLevel = "INFO" | "WARN" | "ERROR";

export interface ObservabilityEventInput {
  source: string;
  eventType: string;
  message: string;
  level?: ObservabilityLevel;
  userEmail?: string | null;
  metadata?: Record<string, unknown> | null;
}

let observabilityTableReady = false;

export async function ensureObservabilityInfra() {
  if (observabilityTableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS observability_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source TEXT NOT NULL,
      event_type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      user_email TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS observability_events_created_at_idx
      ON observability_events(created_at DESC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS observability_events_level_idx
      ON observability_events(level)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS observability_events_source_idx
      ON observability_events(source)
  `);

  observabilityTableReady = true;
}

export async function recordObservabilityEvent(
  input: ObservabilityEventInput,
): Promise<void> {
  const level = input.level || "INFO";

  try {
    await ensureObservabilityInfra();
    await prisma.$executeRaw`
      INSERT INTO observability_events (
        source,
        event_type,
        level,
        message,
        user_email,
        metadata
      ) VALUES (
        ${input.source},
        ${input.eventType},
        ${level},
        ${input.message},
        ${input.userEmail ?? null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb
      )
    `;
  } catch (error) {
    console.warn("[observability] persist_failed", error);
  }
}
