"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isVerifiedAdminEmail } from "@/lib/admin";
import { ensureObservabilityInfra } from "@/lib/observability";

async function assertAdmin(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.email ||
    !(await isVerifiedAdminEmail(session.user.email))
  ) {
    throw new Error("unauthorized");
  }

  return session.user.email;
}

export async function gerarEventoTesteObservabilidade(): Promise<void> {
  try {
    const userEmail = await assertAdmin();
    await ensureObservabilityInfra();

    await prisma.$executeRaw`
      INSERT INTO observability_events (source, event_type, level, message, user_email, metadata)
      VALUES
        ('manual_test', 'dashboard_seed', 'INFO', 'Evento de teste manual (INFO).', ${userEmail}, '{"from":"dashboard_button","kind":"seed"}'::jsonb),
        ('manual_test', 'dashboard_seed', 'WARN', 'Evento de teste manual (WARN).', ${userEmail}, '{"from":"dashboard_button","kind":"seed"}'::jsonb),
        ('manual_test', 'dashboard_seed', 'ERROR', 'Evento de teste manual (ERROR).', ${userEmail}, '{"from":"dashboard_button","kind":"seed"}'::jsonb)
    `;

    revalidatePath("/admin/observabilidade");
    redirect("/admin/observabilidade?success=seed");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/admin/observabilidade?error=seed");
  }
}

export async function limparEventosTesteObservabilidade(): Promise<void> {
  try {
    await assertAdmin();
    await ensureObservabilityInfra();

    await prisma.$executeRaw`
      DELETE FROM observability_events
      WHERE source = 'manual_test'
    `;

    revalidatePath("/admin/observabilidade");
    redirect("/admin/observabilidade?success=cleared");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/admin/observabilidade?error=clear");
  }
}
