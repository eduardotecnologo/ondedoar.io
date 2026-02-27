"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function atualizarPonto(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?error=auth_required");
  }

  const id = String(formData.get("id") || "");
  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const endereco = String(formData.get("endereco") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const estado = String(formData.get("estado") || "")
    .trim()
    .toUpperCase();
  const telefone = String(formData.get("telefone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const categoriasRaw = formData.getAll("categorias");

  if (!id || !nome || !endereco || !numero || !cidade || !estado) {
    redirect(`/pontos/${id}/editar?error=missing_fields`);
  }

  const categoriasIds = categoriasRaw
    .map((value) => (typeof value === "string" ? value : String(value)))
    .filter((value) => value.length > 0);

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      redirect("/login?error=auth_required");
    }

    const ponto = await prisma.pontoColeta.findUnique({
      where: { id },
    });

    if (!ponto) {
      redirect("/dashboard?error=ponto_not_found");
    }

    if (ponto.user_id !== null && ponto.user_id !== user.id) {
      redirect("/dashboard?error=not_allowed");
    }

    let latitude: number | null = ponto.latitude ?? null;
    let longitude: number | null = ponto.longitude ?? null;

    const query = encodeURIComponent(
      `${endereco}, ${numero}, ${cidade}, ${estado}, Brasil`,
    );
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          "User-Agent":
            "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        latitude = Number.parseFloat(data[0].lat);
        longitude = Number.parseFloat(data[0].lon);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.pontoColeta.update({
        where: { id },
        data: {
          nome,
          descricao: descricao || null,
          endereco,
          numero,
          cidade,
          estado,
          telefone: telefone || null,
          whatsapp: whatsapp || null,
          latitude,
          longitude,
          user_id: ponto.user_id ?? user.id,
        },
      });

      await tx.pontoCategoria.deleteMany({
        where: { ponto_id: id },
      });

      if (categoriasIds.length > 0) {
        await tx.pontoCategoria.createMany({
          data: categoriasIds.map((categoriaId) => ({
            ponto_id: id,
            categoria_id: categoriaId,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/pontos/${id}/editar`);
    redirect("/dashboard?success=updated");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao atualizar ponto:", error);
    redirect(`/pontos/${id}/editar?error=1`);
  }
}
