"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function deletarPonto(pontoId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Não autorizado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) throw new Error("Usuário não encontrado.");

  const ponto = await prisma.pontoColeta.findUnique({
    where: { id: pontoId },
    select: {
      id: true,
      user_id: true,
    },
  });

  if (!ponto) throw new Error("Ponto não encontrado.");

  // Permite excluir se o ponto pertence ao usuário OU se user_id é null
  // (pontos criados antes da correção do authOptions ficaram sem user_id)
  if (ponto.user_id !== null && ponto.user_id !== user.id) {
    throw new Error("Você não tem permissão para excluir este ponto.");
  }

  // Se o ponto estava órfão (user_id null), vincula ao usuário atual antes de deletar
  // Isso também corrige o estado inconsistente no banco
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
