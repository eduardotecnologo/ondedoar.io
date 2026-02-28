"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isAdminEmail } from "@/lib/admin";

export async function cadastrarRuaInterditada(
  formData: FormData,
): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?error=auth_required");
  }

  const rua = String(formData.get("rua") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const estado = String(formData.get("estado") || "")
    .trim()
    .toUpperCase();
  const referencia = String(formData.get("referencia") || "").trim();
  const motivo = String(formData.get("motivo") || "").trim();
  const foto = formData.get("foto");

  if (!rua || !cidade || !estado) {
    redirect("/interdicoes?error=missing_fields");
  }

  if (!(foto instanceof File) || foto.size <= 0) {
    redirect("/interdicoes?error=missing_photo");
  }

  if (!foto.type.startsWith("image/")) {
    redirect("/interdicoes?error=invalid_photo");
  }

  const maxFileSizeInBytes = 4 * 1024 * 1024;
  if (foto.size > maxFileSizeInBytes) {
    redirect("/interdicoes?error=photo_too_large");
  }

  const fotoBuffer = Buffer.from(await foto.arrayBuffer());
  const fotoMotivo = `data:${foto.type};base64,${fotoBuffer.toString("base64")}`;

  let latitude: number | null = null;
  let longitude: number | null = null;

  try {
    const queryNumero = numero ? `${rua}, ${numero}` : rua;
    const query = encodeURIComponent(
      `${queryNumero}, ${cidade}, ${estado}, Brasil`,
    );

    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          "User-Agent":
            "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
        },
      },
    );

    if (geoResponse.ok) {
      const data = await geoResponse.json();
      if (Array.isArray(data) && data.length > 0) {
        latitude = Number.parseFloat(data[0].lat);
        longitude = Number.parseFloat(data[0].lon);
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    await prisma.ruaInterditada.create({
      data: {
        rua,
        numero: numero || null,
        cidade,
        estado,
        referencia: referencia || null,
        motivo: motivo || null,
        foto_motivo: fotoMotivo,
        latitude,
        longitude,
        user_id: user?.id ?? null,
        ativa: true,
      },
    });

    revalidatePath("/interdicoes");
    revalidatePath("/");
    redirect("/interdicoes?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao cadastrar rua interditada:", error);
    redirect("/interdicoes?error=unknown");
  }
}

export async function encerrarRuaInterditada(
  formData: FormData,
): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?error=auth_required");
  }

  const interdicaoId = String(formData.get("id") || "").trim();
  if (!interdicaoId) {
    redirect("/interdicoes?error=invalid_id");
  }

  try {
    const [user, interdicao] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      }),
      prisma.ruaInterditada.findUnique({
        where: { id: interdicaoId },
        select: { id: true, user_id: true },
      }),
    ]);

    if (!user || !interdicao) {
      redirect("/interdicoes?error=not_found");
    }

    const canClose =
      interdicao.user_id === user.id || isAdminEmail(user.email ?? null);

    if (!canClose) {
      redirect("/interdicoes?error=not_allowed");
    }

    await prisma.ruaInterditada.update({
      where: { id: interdicaoId },
      data: { ativa: false },
    });

    revalidatePath("/interdicoes");
    revalidatePath("/");
    redirect("/interdicoes?success=closed");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao encerrar interdição:", error);
    redirect("/interdicoes?error=unknown");
  }
}
