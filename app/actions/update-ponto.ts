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
  const cep = String(formData.get("cep") || "").trim();
  const statusDoacaoRaw = String(formData.get("status_doacao") || "").trim();
  const telefone = String(formData.get("telefone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const statusAutoAtivarEmRaw = String(
    formData.get("status_auto_ativar_em") || "",
  ).trim();
  const statusAutoInativarEmRaw = String(
    formData.get("status_auto_inativar_em") || "",
  ).trim();
  const clientTimezoneOffsetMinutes = Number(
    formData.get("client_timezone_offset_minutes") || "0",
  );
  const voluntarioEspecialidades = String(
    formData.get("voluntario_especialidades") || "",
  ).trim();
  const voluntarioContatoAgendamento = String(
    formData.get("voluntario_contato_agendamento") || "",
  ).trim();
  const voluntarioDisponivelRaw = String(
    formData.get("voluntario_disponivel") || "",
  ).trim();
  const fraldasPublicoRaw = String(
    formData.get("fraldas_publico") || "",
  ).trim();
  const transporteTipoVeiculoRaw = String(
    formData.get("transporte_tipo_veiculo") || "",
  ).trim();
  const transporteDisponivelEmRaw = String(
    formData.get("transporte_disponivel_em") || "",
  ).trim();
  const categoriasRaw = formData.getAll("categorias");

  if (!id || !nome || !endereco || !numero || !cidade || !estado || !cep) {
    redirect(`/pontos/${id}/editar?error=missing_fields`);
  }

  const categoriasIds = categoriasRaw
    .map((value) => (typeof value === "string" ? value : String(value)))
    .filter((value) => value.length > 0);

  const normalizedStatusDoacaoRaw = statusDoacaoRaw.trim().toUpperCase();
  const statusDoacao =
    normalizedStatusDoacaoRaw === "INATIVO"
      ? "INATIVO"
      : normalizedStatusDoacaoRaw === "ATIVO"
        ? "ATIVO"
        : normalizedStatusDoacaoRaw === "RECEBENDO"
          ? "RECEBENDO"
          : normalizedStatusDoacaoRaw === "DOANDO_RECEBENDO" ||
              normalizedStatusDoacaoRaw === "DOANDO/RECEBENDO" ||
              normalizedStatusDoacaoRaw === "DANDO/RECEBENDO"
            ? "DOANDO_RECEBENDO"
            : "DOANDO";

  const parseDateTimeLocal = (
    value: string,
    timezoneOffsetMinutes: number,
  ): Date | null => {
    if (!value) return null;

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      const fallbackDate = new Date(value);
      return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }

    const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    const utcMillis =
      Date.UTC(year, month - 1, day, hour, minute) +
      timezoneOffsetMinutes * 60_000;

    const parsedDate = new Date(utcMillis);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const safeTimezoneOffset = Number.isFinite(clientTimezoneOffsetMinutes)
    ? clientTimezoneOffsetMinutes
    : 0;

  const statusAutoAtivarEm = parseDateTimeLocal(
    statusAutoAtivarEmRaw,
    safeTimezoneOffset,
  );
  const statusAutoInativarEm = parseDateTimeLocal(
    statusAutoInativarEmRaw,
    safeTimezoneOffset,
  );

  const normalizeInstagramUrl = (value: string): string | null => {
    if (!value) return null;

    const trimmedValue = value.trim();
    const handleMatch = trimmedValue.match(/^@([a-zA-Z0-9._]{1,30})$/);
    if (handleMatch?.[1]) {
      return `https://instagram.com/${handleMatch[1]}`;
    }

    const normalizedValue = /^https?:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;

    const isInstagramUrl = /^https?:\/\/(www\.)?instagram\.com\//i.test(
      normalizedValue,
    );

    return isInstagramUrl ? normalizedValue : null;
  };

  const instagramUrl = normalizeInstagramUrl(website);
  const descricaoSemInstagram = descricao
    .replace(
      /\n?Instagram:\s*https?:\/\/(?:www\.)?instagram\.com\/[\w\d._\/-]+\s*/gi,
      "",
    )
    .trim();
  const descricaoComInstagram = [
    descricaoSemInstagram,
    instagramUrl ? `Instagram: ${instagramUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      redirect("/login?error=auth_required");
    }

    const ponto = await prisma.pontoColeta.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!ponto) {
      redirect("/dashboard?error=ponto_not_found");
    }

    if (ponto.user_id !== null && ponto.user_id !== user.id) {
      redirect("/dashboard?error=not_allowed");
    }

    const categoriaVoluntario = await prisma.tipoDoacao.findFirst({
      where: {
        OR: [
          { nome: { equals: "VOLUNTARIO", mode: "insensitive" } },
          { nome: { equals: "VOLUNTÁRIO", mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    const voluntarioSelecionado = categoriaVoluntario
      ? categoriasIds.includes(categoriaVoluntario.id)
      : false;

    const categoriaFraudas = await prisma.tipoDoacao.findFirst({
      where: {
        OR: [
          { nome: { equals: "FRAUDAS", mode: "insensitive" } },
          { nome: { equals: "FRALDAS", mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    const fraldasSelecionada = categoriaFraudas
      ? categoriasIds.includes(categoriaFraudas.id)
      : false;

    const fraldasPublico = fraldasPublicoRaw.toUpperCase();

    if (
      fraldasSelecionada &&
      fraldasPublico !== "ADULTO" &&
      fraldasPublico !== "CRIANCA"
    ) {
      redirect(`/pontos/${id}/editar?error=fraldas_publico`);
    }

    const categoriaTransporte = await prisma.tipoDoacao.findFirst({
      where: { nome: { equals: "TRANSPORTE", mode: "insensitive" } },
      select: { id: true },
    });

    const transporteSelecionado = categoriaTransporte
      ? categoriasIds.includes(categoriaTransporte.id)
      : false;

    const transporteTipoVeiculo = transporteTipoVeiculoRaw.toUpperCase();
    const transporteDisponivelEm = transporteSelecionado
      ? parseDateTimeLocal(transporteDisponivelEmRaw, safeTimezoneOffset)
      : null;

    let latitude: number | null = ponto.latitude ?? null;
    let longitude: number | null = ponto.longitude ?? null;

    const query = encodeURIComponent(
      `${endereco}, ${numero}, ${cidade}, ${estado}${cep ? `, ${cep}` : ""}, Brasil`,
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
          descricao: descricaoComInstagram || null,
          status_doacao: statusDoacao,
          cep,
          endereco,
          numero,
          cidade,
          estado,
          telefone: telefone || null,
          whatsapp: whatsapp || telefone || null,
          voluntario_especialidades: voluntarioSelecionado
            ? voluntarioEspecialidades || null
            : null,
          voluntario_contato_agendamento: voluntarioSelecionado
            ? voluntarioContatoAgendamento || null
            : null,
          voluntario_disponivel: voluntarioSelecionado
            ? ["1", "on", "true"].includes(
                voluntarioDisponivelRaw.toLowerCase(),
              )
            : null,
          fraldas_publico: fraldasSelecionada ? fraldasPublico : null,
          latitude,
          longitude,
          user_id: ponto.user_id ?? user.id,
        },
      });

      try {
        await tx.$executeRaw`
          UPDATE pontos_coleta
          SET status_auto_ativar_em = ${statusAutoAtivarEm},
              status_auto_inativar_em = ${statusAutoInativarEm},
              transporte_tipo_veiculo = ${transporteSelecionado ? transporteTipoVeiculo || null : null},
              transporte_disponivel_em = ${transporteSelecionado ? transporteDisponivelEm : null}
          WHERE id = ${id}::uuid
        `;
      } catch (timerError) {
        console.warn(
          "Não foi possível atualizar timer automático do ponto:",
          timerError,
        );
      }

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

    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : String(error);

    if (errorMessage.includes("status_doacao")) {
      redirect(`/pontos/${id}/editar?error=status_doacao_migration`);
    }

    redirect(`/pontos/${id}/editar?error=1`);
  }
}
