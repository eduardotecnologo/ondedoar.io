"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

export async function deletarPontoAdmin(formData: FormData): Promise<void> {
  const session = await getServerSession();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Não autorizado");
  }

  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID de ponto inválido");
  }

  // Deleta primeiro as relações (categorias) e depois o ponto
  await prisma.pontoCategoria.deleteMany({ where: { ponto_id: id } });
  await prisma.pontoColeta.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function deletarUsuarioAdmin(formData: FormData): Promise<void> {
  const session = await getServerSession();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Não autorizado");
  }

  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID de usuário inválido");
  }

  // Remove todos os pontos do usuário antes de apagar o usuário
  const pontos = await prisma.pontoColeta.findMany({
    where: { user_id: id },
    select: { id: true },
  });

  const idsPontos = pontos.map((p) => p.id);

  if (idsPontos.length > 0) {
    await prisma.pontoCategoria.deleteMany({
      where: { ponto_id: { in: idsPontos } },
    });
    await prisma.pontoColeta.deleteMany({
      where: { id: { in: idsPontos } },
    });
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

