"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function cadastrarPonto(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    redirect("/login?error=auth_required");
  }

  // Extrai campos do form
  const nome = (formData.get("nome") as string) || "";
  const descricao = (formData.get("descricao") as string) || "";
  const endereco = (formData.get("endereco") as string) || "";
  const numero = (formData.get("numero") as string) || "";
  const cidade = (formData.get("cidade") as string) || "";
  const estado = (formData.get("estado") as string) || "";
  const cep = (formData.get("cep") as string) || "";
  const statusDoacaoRaw = (formData.get("status_doacao") as string) || "";
  const telefone = (formData.get("telefone") as string) || "";
  const whatsapp = (formData.get("whatsapp") as string) || "";
  const website = (formData.get("website") as string) || "";
  const statusAutoAtivarEmRaw =
    (formData.get("status_auto_ativar_em") as string) || "";
  const statusAutoInativarEmRaw =
    (formData.get("status_auto_inativar_em") as string) || "";
  const clientTimezoneOffsetMinutes = Number(
    formData.get("client_timezone_offset_minutes") || "0",
  );
  if (!cep.trim()) {
    redirect("/cadastrar?error=1");
  }

  const voluntarioEspecialidades =
    (formData.get("voluntario_especialidades") as string) || "";
  const voluntarioContatoAgendamento =
    (formData.get("voluntario_contato_agendamento") as string) || "";
  const voluntarioDisponivelRaw =
    (formData.get("voluntario_disponivel") as string) || "";
  const fraldasPublicoRaw = (formData.get("fraldas_publico") as string) || "";
  const categoriasRaw = formData.getAll("categorias"); // pode ser um array de ids ou vazio

  // Normaliza categorias para string[]
  const categoriasIds: string[] = categoriasRaw
    .map((v) => (typeof v === "string" ? v : String(v)))
    .filter((v) => v && v.length > 0);

  if (categoriasIds.length === 0) {
    redirect("/cadastrar?error=no_category");
  }

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
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    const match = trimmedValue.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
    );

    if (!match) {
      const parsedDate = new Date(trimmedValue);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

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
  const descricaoNormalizada = descricao.trim();
  const descricaoComInstagram = [
    descricaoNormalizada,
    instagramUrl &&
    !descricaoNormalizada.toLowerCase().includes("instagram.com")
      ? `Instagram: ${instagramUrl}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Geocoding via Nominatim
  let latitude = 0;
  let longitude = 0;

  try {
    if (endereco || cidade || estado) {
      const queryEndereco = numero ? `${endereco}, ${numero}` : endereco;
      const query = encodeURIComponent(
        `${queryEndereco}, ${cidade}, ${estado}, ${cep}, Brasil`,
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            "User-Agent":
              "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
        }
      }
    }

    // Busca usuário no banco pelo email da sessão
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

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

    const fraldasPublico = fraldasPublicoRaw.trim().toUpperCase();

    if (
      fraldasSelecionada &&
      fraldasPublico !== "ADULTO" &&
      fraldasPublico !== "CRIANCA"
    ) {
      redirect("/cadastrar?error=fraldas_publico");
    }

    // Monta payload de criação
    const createData: Prisma.PontoColetaUncheckedCreateInput = {
      nome,
      descricao: descricaoComInstagram || null,
      status_doacao: statusDoacao,
      cep: cep.trim(),
      endereco,
      numero,
      cidade,
      estado,
      telefone: telefone || null,
      whatsapp: whatsapp || telefone || null,
      voluntario_especialidades: voluntarioSelecionado
        ? voluntarioEspecialidades.trim() || null
        : null,
      voluntario_contato_agendamento: voluntarioSelecionado
        ? voluntarioContatoAgendamento.trim() || null
        : null,
      voluntario_disponivel: voluntarioSelecionado
        ? ["1", "on", "true"].includes(voluntarioDisponivelRaw.toLowerCase())
        : null,
      fraldas_publico: fraldasSelecionada ? fraldasPublico : null,
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      user_id: user?.id ?? null, // vincula ao usuário se existir
    };

    // Adiciona categorias se houver
    if (categoriasIds.length > 0) {
      createData.ponto_categorias = {
        create: categoriasIds.map((id) => ({
          categoria_id: id,
        })),
      };
    }

    // Cria o ponto
    const pontoCriado = await prisma.pontoColeta.create({
      data: createData,
    });

    try {
      await prisma.$executeRaw`
        UPDATE pontos_coleta
        SET status_auto_ativar_em = ${statusAutoAtivarEm},
            status_auto_inativar_em = ${statusAutoInativarEm}
        WHERE id = ${pontoCriado.id}::uuid
      `;
    } catch (timerError) {
      console.warn(
        "Não foi possível salvar timer automático do ponto:",
        timerError,
      );
    }

    // Revalida a rota raiz e redireciona para sucesso
    revalidatePath("/");
    redirect("/?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao cadastrar ponto:", error);
    redirect("/cadastrar?error=1");
  }
}
