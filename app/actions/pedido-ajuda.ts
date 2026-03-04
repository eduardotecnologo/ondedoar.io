"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isVerifiedAdminEmail } from "@/lib/admin";

const CATEGORIAS_VALIDAS = [
  "ALIMENTOS",
  "AGASALHO",
  "HIGIENE",
  "HIGIENE/LIMPEZA",
  "REMEDIO",
  "ABRIGO",
  "MOVEIS",
  "ELETRODOMESTICO",
  "DOCUMENTOS",
  "OUTRO",
] as const;

const URGENCIAS_VALIDAS = ["BAIXA", "MEDIA", "ALTA"] as const;

function asText(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function cadastrarPedidoAjuda(formData: FormData): Promise<void> {
  const nome = asText(formData.get("nome"));
  const contato = asText(formData.get("contato"));
  const cidade = asText(formData.get("cidade"));
  const estado = asText(formData.get("estado")).toUpperCase();
  const categoriaRaw = asText(formData.get("categoria")).toUpperCase();
  const descricao = asText(formData.get("descricao"));
  const urgenciaRaw = asText(formData.get("urgencia")).toUpperCase();
  const anonimoRaw = asText(formData.get("anonimo")).toLowerCase();

  const anonimo = anonimoRaw === "on" || anonimoRaw === "1";

  const categoria = CATEGORIAS_VALIDAS.includes(
    categoriaRaw as (typeof CATEGORIAS_VALIDAS)[number],
  )
    ? categoriaRaw
    : "OUTRO";

  const urgencia = URGENCIAS_VALIDAS.includes(
    urgenciaRaw as (typeof URGENCIAS_VALIDAS)[number],
  )
    ? urgenciaRaw
    : "MEDIA";

  const nomeFinal = anonimo ? "ANONIMO" : nome;

  if (!cidade || !estado || !descricao || !contato || (!anonimo && !nome)) {
    redirect("/pedido-ajuda?error=required");
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO pedidos_ajuda (
        nome,
        contato,
        cidade,
        estado,
        categoria,
        descricao,
        urgencia,
        status,
        anonimo
      ) VALUES (
        ${nomeFinal},
        ${contato},
        ${cidade},
        ${estado},
        ${categoria},
        ${descricao},
        ${urgencia},
        ${"ABERTO"},
        ${anonimo}
      )
    `;

    revalidatePath("/pedido-ajuda");
    revalidatePath("/admin/pedidos-ajuda");
    redirect("/pedido-ajuda?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao cadastrar pedido de ajuda:", error);
    redirect("/pedido-ajuda?error=save");
  }
}

export async function atualizarStatusPedidoAjuda(
  formData: FormData,
): Promise<void> {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.email ||
    !(await isVerifiedAdminEmail(session.user.email))
  ) {
    throw new Error("Não autorizado");
  }

  const id = asText(formData.get("id"));
  const statusRaw = asText(formData.get("status")).toUpperCase();

  const status = ["ABERTO", "EM_ATENDIMENTO", "ATENDIDO", "ENCERRADO"].includes(
    statusRaw,
  )
    ? statusRaw
    : "ABERTO";

  if (!id) {
    redirect("/admin/pedidos-ajuda?error=invalid");
  }

  try {
    await prisma.$executeRaw`
      UPDATE pedidos_ajuda
      SET status = ${status}
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/admin/pedidos-ajuda");
    redirect("/admin/pedidos-ajuda?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao atualizar status do pedido:", error);
    redirect("/admin/pedidos-ajuda?error=save");
  }
}

export async function marcarPedidoComoAtendido(
  formData: FormData,
): Promise<void> {
  const id = asText(formData.get("id"));
  const atendidoPorNome = asText(formData.get("atendido_por_nome"));
  const atendidoPorAnonimoRaw = asText(
    formData.get("atendido_por_anonimo"),
  ).toLowerCase();

  const atendidoPorAnonimo =
    atendidoPorAnonimoRaw === "on" || atendidoPorAnonimoRaw === "1";

  if (!id) {
    redirect("/pedido-ajuda?error=invalid");
  }

  if (!atendidoPorAnonimo && !atendidoPorNome) {
    redirect("/pedido-ajuda?error=attendant_required");
  }

  const nomeFinal = atendidoPorAnonimo ? "ANONIMO" : atendidoPorNome;

  try {
    await prisma.$executeRaw`
      UPDATE pedidos_ajuda
      SET
        status = 'ATENDIDO',
        atendido_por_nome = ${nomeFinal},
        atendido_por_anonimo = ${atendidoPorAnonimo},
        atendido_em = now(),
        atualizado_em = now()
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/pedido-ajuda");
    revalidatePath("/admin/pedidos-ajuda");
    revalidatePath("/");
    redirect("/pedido-ajuda?success=attended");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao marcar pedido como atendido:", error);
    redirect("/pedido-ajuda?error=save");
  }
}
