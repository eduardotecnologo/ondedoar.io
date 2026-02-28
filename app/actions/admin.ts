"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isAdminEmail } from "@/lib/admin";

export async function deletarPontoAdmin(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);

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
  const session = await getServerSession(authOptions);

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

export async function criarCategoriaAdmin(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Não autorizado");
  }

  const nomeRaw = formData.get("nome");
  const iconeRaw = formData.get("icone");

  const nome = typeof nomeRaw === "string" ? nomeRaw.trim().toUpperCase() : "";
  const icone = typeof iconeRaw === "string" ? iconeRaw.trim() : "";

  if (!nome) {
    redirect("/admin?cat_error=missing_nome");
  }

  try {
    await prisma.tipoDoacao.create({
      data: {
        nome,
        icone: icone || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    redirect("/admin?cat_success=1");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    redirect("/admin?cat_error=exists_or_invalid");
  }
}

export async function deletarCategoriaAdmin(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Não autorizado");
  }

  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID de categoria inválido");
  }

  // Remove vínculos antes de remover a categoria
  await prisma.pontoCategoria.deleteMany({ where: { categoria_id: id } });
  await prisma.tipoDoacao.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/");
}
