"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

export async function deletarPonto(pontoId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Não autorizado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // Verifica se o ponto pertence ao usuário antes de deletar
  const ponto = await prisma.pontoColeta.findUnique({
    where: { id: pontoId },
  });

  if (ponto?.user_id !== user?.id) {
    throw new Error("Você não tem permissão para excluir este ponto.");
  }

  // Deleta primeiro as relações (categorias) e depois o ponto
  await prisma.pontoCategoria.deleteMany({ where: { ponto_id: pontoId } });
  await prisma.pontoColeta.delete({ where: { id: pontoId } });

  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function deletarPontoFromForm(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("ID de ponto inválido");
  }
  await deletarPonto(id);
}
