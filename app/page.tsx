import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import FlashMessage from "@/components/FlashMessage";
import MapaWrapper from "@/components/MapaWrapper";
import MapaInterdicoesWrapper from "@/components/MapaInterdicoesWrapper";
import AuthButton from "@/components/AuthButton";
import PontoDetalhesButton from "@/components/PontoDetalhesButton";
import VerNoMapaButton from "@/components/VerNoMapaButton";
import UseMyLocationButton from "@/components/UseMyLocationButton";
import type { Ponto } from "@/types/ponto";
import type { Interdicao } from "@/types/interdicao";

type PontoWithCategorias = Prisma.PontoColetaGetPayload<{
  select: {
    id: true;
    nome: true;
    descricao: true;
    status_doacao: true;
    endereco: true;
    numero: true;
    cidade: true;
    estado: true;
    telefone: true;
    whatsapp: true;
    voluntario_especialidades: true;
    voluntario_contato_agendamento: true;
    voluntario_disponivel: true;
    fraldas_publico: true;
    latitude: true;
    longitude: true;
    ponto_categorias: {
      select: {
        categoria_id: true;
        categorias: {
          select: {
            id: true;
            nome: true;
          };
        };
      };
    };
  };
}>;

type TipoDoacao = Prisma.TipoDoacaoGetPayload<{
  select: {
    id: true;
    nome: true;
  };
}>;

interface HomeProps {
  searchParams?:
    | Promise<{
        cidade?: string;
        categoria?: string;
        categoriaId?: string;
        geoLat?: string;
        geoLon?: string;
        success?: string;
      }>
    | {
        cidade?: string;
        categoria?: string;
        categoriaId?: string;
        geoLat?: string;
        geoLon?: string;
        success?: string;
      };
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
  };
};

type InmetAlert = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  severity: "GRANDE_PERIGO" | "PERIGO" | "PERIGO_POTENCIAL" | "AVISO";
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function extractTagValue(itemXml: string, tagName: string): string {
  const match = itemXml.match(
    new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"),
  );
  return match?.[1]?.trim() ?? "";
}

function parseInmetRss(xml: string): InmetAlert[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

  return items
    .map((itemXml) => {
      const title = stripHtml(extractTagValue(itemXml, "title"));
      const description = stripHtml(extractTagValue(itemXml, "description"));
      const link = stripHtml(extractTagValue(itemXml, "link"));
      const pubDate = stripHtml(extractTagValue(itemXml, "pubDate"));

      const titleNormalized = normalizeText(title);
      const severity: InmetAlert["severity"] = titleNormalized.includes(
        "GRANDE PERIGO",
      )
        ? "GRANDE_PERIGO"
        : titleNormalized.includes("PERIGO POTENCIAL")
          ? "PERIGO_POTENCIAL"
          : titleNormalized.includes("PERIGO")
            ? "PERIGO"
            : "AVISO";

      return {
        title,
        description,
        link,
        pubDate,
        severity,
      };
    })
    .filter((item) => item.title.length > 0);
}

function weatherCodeLabel(code?: number): string {
  if (code === undefined) return "Condição indisponível";

  if ([0].includes(code)) return "Céu limpo";
  if ([1, 2, 3].includes(code)) return "Parcialmente nublado";
  if ([45, 48].includes(code)) return "Neblina";
  if ([51, 53, 55, 56, 57].includes(code)) return "Garoa";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Chuva";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neve";
  if ([95, 96, 99].includes(code)) return "Tempestade";

  return "Condição variável";
}

export default async function Home(props: HomeProps) {
  // Unwrap searchParams (Next pode passar como Promise)
  const searchParams = await (props.searchParams ?? {});

  const cidadeFiltro = searchParams?.cidade?.trim() || undefined;
  const categoriaFiltroNome = searchParams?.categoria?.trim() || undefined;
  const categoriaFiltroId = searchParams?.categoriaId?.trim() || undefined;
  const geoLat = Number(searchParams?.geoLat);
  const geoLon = Number(searchParams?.geoLon);
  const hasGeoCoords = Number.isFinite(geoLat) && Number.isFinite(geoLon);

  const normalizeCategoryName = (value: string): string =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  const getDisplayCategoryName = (name: string): string => {
    const normalized = normalizeCategoryName(name);
    if (normalized === "FRAIUDAS" || normalized === "FRALDAS") {
      return "FRAUDAS";
    }
    return name.trim();
  };

  const buildCategoryHref = (categoriaId?: string): string => {
    const params = new URLSearchParams();

    if (cidadeFiltro) {
      params.set("cidade", cidadeFiltro);
    }

    if (categoriaId) {
      params.set("categoriaId", categoriaId);
    }

    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  // Monta filtro condicional com tipagem explícita do Prisma
  const where: Prisma.PontoColetaWhereInput = {
    ...(cidadeFiltro
      ? {
          cidade: {
            contains: cidadeFiltro,
            mode: "insensitive",
          },
        }
      : {}),
    ...(categoriaFiltroId
      ? {
          ponto_categorias: {
            some: {
              categoria_id: categoriaFiltroId,
            },
          },
        }
      : categoriaFiltroNome
        ? {
            ponto_categorias: {
              some: {
                categorias: {
                  nome: {
                    equals: categoriaFiltroNome,
                    mode: "insensitive",
                  },
                },
              },
            },
          }
        : {}),
  };

  let dbUnavailable = false;
  let pontosRaw: PontoWithCategorias[] = [];
  let categorias: TipoDoacao[] = [];

  try {
    [pontosRaw, categorias] = await Promise.all([
      prisma.pontoColeta.findMany({
        where,
        select: {
          id: true,
          nome: true,
          descricao: true,
          status_doacao: true,
          endereco: true,
          numero: true,
          cidade: true,
          estado: true,
          telefone: true,
          whatsapp: true,
          voluntario_especialidades: true,
          voluntario_contato_agendamento: true,
          voluntario_disponivel: true,
          fraldas_publico: true,
          latitude: true,
          longitude: true,
          ponto_categorias: {
            select: {
              categoria_id: true,
              categorias: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
        orderBy: { criado_em: "desc" },
      }),
      prisma.tipoDoacao.findMany({
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
      }),
    ]);
  } catch (error) {
    dbUnavailable = true;
    console.error("Erro ao carregar pontos/categorias na Home:", error);
  }

  const timerStatusById = new Map<
    string,
    { statusAutoAtivarEm: Date | null; statusAutoInativarEm: Date | null }
  >();

  const fotoPontoById = new Map<string, string | null>();

  try {
    const timerStatusRows = await prisma.$queryRaw<
      Array<{
        id: string;
        status_auto_ativar_em: Date | null;
        status_auto_inativar_em: Date | null;
      }>
    >`
      SELECT id, status_auto_ativar_em, status_auto_inativar_em
      FROM pontos_coleta
    `;

    for (const row of timerStatusRows) {
      timerStatusById.set(row.id, {
        statusAutoAtivarEm: row.status_auto_ativar_em,
        statusAutoInativarEm: row.status_auto_inativar_em,
      });
    }
  } catch (error) {
    console.warn("Timer automático indisponível na Home:", error);
  }

  try {
    const fotoRows = await prisma.$queryRaw<
      Array<{
        id: string;
        foto_ponto: string | null;
      }>
    >`
      SELECT id, foto_ponto
      FROM pontos_coleta
    `;

    for (const row of fotoRows) {
      fotoPontoById.set(row.id, row.foto_ponto);
    }
  } catch (error) {
    console.warn("Fotos dos pontos indisponíveis na Home:", error);
  }

  // Transforma para o formato que os componentes front esperam (types/ponto.ts)
  const now = new Date();

  const pontos: Ponto[] = pontosRaw.map((p) => {
    const timerStatus = timerStatusById.get(p.id);
    const statusBase =
      p.status_doacao === "INATIVO"
        ? "INATIVO"
        : p.status_doacao === "ATIVO"
          ? "ATIVO"
          : p.status_doacao === "RECEBENDO"
            ? "RECEBENDO"
            : p.status_doacao === "DOANDO_RECEBENDO" ||
                p.status_doacao === "DOANDO/RECEBENDO" ||
                p.status_doacao === "DANDO/RECEBENDO"
              ? "DOANDO_RECEBENDO"
              : p.status_doacao === "DOANDO"
                ? "DOANDO"
                : "DOANDO";

    const statusAuto =
      timerStatus?.statusAutoInativarEm &&
      now >= timerStatus.statusAutoInativarEm
        ? "INATIVO"
        : timerStatus?.statusAutoInativarEm &&
            now < timerStatus.statusAutoInativarEm
          ? "ATIVO"
          : timerStatus?.statusAutoAtivarEm &&
              now >= timerStatus.statusAutoAtivarEm
            ? "ATIVO"
            : null;

    return {
      id: p.id,
      nome: p.nome,
      detalhes: p.descricao ?? null,
      fotoPonto: fotoPontoById.get(p.id) ?? null,
      statusDoacao: statusAuto ?? statusBase,
      endereco: p.endereco,
      numero: p.numero,
      cidade: p.cidade ?? null,
      estado: p.estado ?? null,
      telefone: p.telefone ?? null,
      whatsapp: p.whatsapp ?? null,
      voluntarioEspecialidades: p.voluntario_especialidades ?? null,
      voluntarioContatoAgendamento: p.voluntario_contato_agendamento ?? null,
      voluntarioDisponivel:
        typeof p.voluntario_disponivel === "boolean"
          ? p.voluntario_disponivel
          : null,
      fraldasPublico: p.fraldas_publico ?? null,
      latitude: typeof p.latitude === "number" ? p.latitude : 0,
      longitude: typeof p.longitude === "number" ? p.longitude : 0,
      categorias: (p.ponto_categorias ?? []).map((pc) => ({
        categoriaId: pc.categoria_id,
        categoria: {
          id: pc.categorias.id,
          nome: pc.categorias.nome,
        },
      })),
    };
  });

  let interdicoesRaw: Array<{
    id: string;
    rua: string;
    numero: string | null;
    cidade: string;
    estado: string;
    referencia: string | null;
    motivo: string | null;
    foto_motivo: string | null;
    ativa: boolean;
    latitude: number | null;
    longitude: number | null;
    criado_em: Date;
  }> = [];

  try {
    interdicoesRaw = await prisma.ruaInterditada.findMany({
      where: { ativa: true },
      orderBy: { criado_em: "desc" },
      take: 100,
    });
  } catch (error) {
    console.error("Erro ao carregar interdições na Home:", error);
  }

  const interdicoes: Interdicao[] = interdicoesRaw.map((item) => ({
    id: item.id,
    rua: item.rua,
    numero: item.numero,
    cidade: item.cidade,
    estado: item.estado,
    referencia: item.referencia,
    motivo: item.motivo,
    fotoMotivo: item.foto_motivo,
    ativa: item.ativa,
    latitude: item.latitude,
    longitude: item.longitude,
    criadoEm: item.criado_em.toISOString(),
  }));

  const categoriasAtalho = categorias
    .filter((categoria) => {
      const normalized = normalizeCategoryName(categoria.nome);

      return normalized !== "DORMITORIOS";
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        ALIMENTOS: 1,
        FRAUDAS: 2,
        FRALDAS: 2,
        FRAIUDAS: 2,
        ROUPAS: 3,
        VOLUNTARIO: 4,
      };

      const aKey = normalizeCategoryName(a.nome);
      const bKey = normalizeCategoryName(b.nome);
      const aPriority = priority[aKey] ?? 999;
      const bPriority = priority[bKey] ?? 999;

      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  const categoriaAtiva = categoriaFiltroId
    ? categoriasAtalho.find((categoria) => categoria.id === categoriaFiltroId)
    : categoriaFiltroNome
      ? categoriasAtalho.find(
          (categoria) =>
            normalizeCategoryName(categoria.nome) ===
            normalizeCategoryName(categoriaFiltroNome),
        )
      : undefined;

  const categoriaFiltro = categoriaAtiva?.nome ?? categoriaFiltroNome;

  const totalPontos = pontos.length;
  const totalCategorias = categoriasAtalho.length;
  const totalCidades = new Set(
    pontos
      .map((p) => (p.cidade ?? "").trim())
      .filter((cidade) => cidade.length > 0),
  ).size;

  let totalPedidosAbertos = 0;
  try {
    const pedidosAbertosRows = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total
      FROM pedidos_ajuda
      WHERE status = 'ABERTO'
    `;
    totalPedidosAbertos = pedidosAbertosRows[0]?.total ?? 0;
  } catch (error) {
    console.warn("Contagem de pedidos de ajuda indisponível na Home:", error);
  }

  const buildWhatsAppUrl = (
    phone: string | null | undefined,
  ): string | null => {
    if (!phone) return null;
    const sanitizedPhone = phone.replace(/\D/g, "");
    if (!sanitizedPhone) return null;
    return `https://wa.me/${sanitizedPhone}`;
  };

  const extractInstagramUrl = (text?: string | null): string | null => {
    if (!text) return null;

    const instagramRegex =
      /(https?:\/\/(?:www\.)?instagram\.com\/[\w\d._\/-]+)/i;
    const match = text.match(instagramRegex);

    if (!match?.[1]) return null;

    return match[1].replace(/[),.;!?]+$/, "");
  };

  const pontoClima = pontos.find(
    (ponto) =>
      typeof ponto.latitude === "number" &&
      typeof ponto.longitude === "number" &&
      ponto.latitude !== 0 &&
      ponto.longitude !== 0,
  );

  let climaAtual: {
    temperatura?: number;
    condicao?: string;
    chanceChuvaHoje?: number;
    chuvaHojeMm?: number;
    cidade?: string | null;
  } | null = null;

  if (pontoClima) {
    try {
      const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
      weatherUrl.searchParams.set("latitude", String(pontoClima.latitude));
      weatherUrl.searchParams.set("longitude", String(pontoClima.longitude));
      weatherUrl.searchParams.set("current", "temperature_2m,weather_code");
      weatherUrl.searchParams.set(
        "daily",
        "precipitation_probability_max,precipitation_sum",
      );
      weatherUrl.searchParams.set("forecast_days", "1");
      weatherUrl.searchParams.set("timezone", "auto");

      const weatherResponse = await fetch(weatherUrl.toString(), {
        next: { revalidate: 1800 },
      });

      if (weatherResponse.ok) {
        const weatherData = (await weatherResponse.json()) as OpenMeteoResponse;
        const weatherCode = weatherData.current?.weather_code;

        climaAtual = {
          temperatura: weatherData.current?.temperature_2m,
          condicao: weatherCodeLabel(weatherCode),
          chanceChuvaHoje:
            weatherData.daily?.precipitation_probability_max?.[0],
          chuvaHojeMm: weatherData.daily?.precipitation_sum?.[0],
          cidade: pontoClima.cidade,
        };
      }
    } catch (error) {
      console.error("Erro ao buscar clima:", error);
    }
  }

  let cidadeDetectadaPorGeo: string | null = null;

  if (hasGeoCoords) {
    try {
      const reverseGeocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${geoLat}&lon=${geoLon}`,
        {
          next: { revalidate: 3600 },
          headers: {
            "User-Agent":
              "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
          },
        },
      );

      if (reverseGeocodeResponse.ok) {
        const reverseData = (await reverseGeocodeResponse.json()) as {
          address?: {
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
          };
        };

        cidadeDetectadaPorGeo =
          reverseData.address?.city ??
          reverseData.address?.town ??
          reverseData.address?.village ??
          reverseData.address?.municipality ??
          null;
      }
    } catch (error) {
      console.warn("Geolocalização reversa indisponível na Home:", error);
    }
  }

  let inmetAlerts: InmetAlert[] = [];
  const alertRegionLabel = (
    cidadeFiltro ??
    cidadeDetectadaPorGeo ??
    pontoClima?.cidade ??
    ""
  ).trim();

  try {
    const inmetResponse = await fetch(
      "https://apiprevmet3.inmet.gov.br/avisos/rss",
      {
        next: { revalidate: 900 },
      },
    );

    if (inmetResponse.ok) {
      const inmetXml = await inmetResponse.text();
      const allAlerts = parseInmetRss(inmetXml);

      const cityContext = alertRegionLabel;
      const normalizedCityContext = cityContext
        ? normalizeText(cityContext)
        : "";

      const filteredAlerts = normalizedCityContext
        ? allAlerts.filter((alert) =>
            normalizeText(`${alert.title} ${alert.description}`).includes(
              normalizedCityContext,
            ),
          )
        : allAlerts;

      inmetAlerts = filteredAlerts.slice(0, 5);
    }
  } catch (error) {
    console.warn("Alertas INMET indisponíveis na Home:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xl font-black text-blue-600 tracking-tighter"
            >
              ondedoar<span className="text-slate-400">.io</span>
            </Link>
            <a
              href="https://wa.me/5532985132378"
              target="_blank"
              rel="noreferrer"
              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold transition-all text-xs sm:text-sm whitespace-nowrap border border-green-200"
            >
              💬 Contato
            </a>
          </div>

          {/* Aqui está a correção: AuthButton + Botão Cadastrar */}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3">
            <UseMyLocationButton variant="compact" />
            <AuthButton />
            <Link
              href="/pedido-ajuda"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 sm:px-5 py-2 rounded-full font-bold transition-all text-xs sm:text-sm whitespace-nowrap border border-emerald-200"
            >
              🤝 Preciso de Ajuda
            </Link>
            <Link
              href="/interdicoes"
              className="bg-red-50 hover:bg-red-100 text-red-700 px-4 sm:px-5 py-2 rounded-full font-bold transition-all text-xs sm:text-sm whitespace-nowrap border border-red-200"
            >
              🚧 Ruas Interditadas
            </Link>
          </div>
        </div>
      </nav>
      {searchParams?.success === "1" && (
        <FlashMessage
          type="success"
          text="Ponto cadastrado com sucesso! Obrigado por ajudar."
        />
      )}

      {dbUnavailable && (
        <section className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-6xl mx-auto text-sm font-medium text-amber-800">
            Banco de dados indisponível no momento. Exibindo a página em modo
            limitado.
          </div>
        </section>
      )}

      {climaAtual && (
        <section className="bg-slate-50 px-4 pt-4">
          <div className="max-w-6xl mx-auto rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-bold text-sky-800">
              Clima agora{climaAtual.cidade ? ` em ${climaAtual.cidade}` : ""}
            </p>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-700">
              <span>
                🌡️{" "}
                <strong>{climaAtual.temperatura?.toFixed(1) ?? "--"}°C</strong>
              </span>
              <span>
                ☁️{" "}
                <strong>
                  {climaAtual.condicao ?? "Condição indisponível"}
                </strong>
              </span>
              <span>
                🌧️ Chance de chuva hoje:{" "}
                <strong>{climaAtual.chanceChuvaHoje ?? 0}%</strong>
              </span>
              <span>
                💧 Previsão de chuva:{" "}
                <strong>{climaAtual.chuvaHojeMm ?? 0} mm</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-50 px-4 pt-4">
        <div className="max-w-6xl mx-auto rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-bold text-rose-800">
            {inmetAlerts.length > 0
              ? "⚠️ Atenção: Alertas oficiais de risco (INMET)"
              : "Alertas oficiais de risco (INMET)"}
          </p>

          {inmetAlerts.length === 0 ? (
            <p className="mt-2 text-sm text-rose-700">
              Sem alertas oficiais no momento para{" "}
              {alertRegionLabel ? (
                <strong>{alertRegionLabel}</strong>
              ) : (
                "sua região"
              )}{" "}
              🙏🏿 .
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {inmetAlerts.map((alert, index) => {
                const severityClass =
                  alert.severity === "GRANDE_PERIGO"
                    ? "bg-red-100 text-red-700"
                    : alert.severity === "PERIGO"
                      ? "bg-orange-100 text-orange-700"
                      : alert.severity === "PERIGO_POTENCIAL"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700";

                const severityLabel =
                  alert.severity === "GRANDE_PERIGO"
                    ? "GRANDE PERIGO"
                    : alert.severity === "PERIGO"
                      ? "PERIGO"
                      : alert.severity === "PERIGO_POTENCIAL"
                        ? "PERIGO POTENCIAL"
                        : "AVISO";

                return (
                  <article
                    key={`${alert.link}-${index}`}
                    className="rounded-xl border border-rose-100 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {alert.title}
                      </p>
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${severityClass}`}
                      >
                        {severityLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                      {alert.description || "Sem detalhes adicionais."}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {alert.pubDate}
                      </span>
                      {alert.link ? (
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-rose-700 hover:text-rose-900"
                        >
                          Ver aviso
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-blue-600 pt-16 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Onde Doar?
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Encontre rapidamente onde doar ou onde buscar ajuda na sua cidade.
            Informação clara, ação imediata. 💛 Faça o contato no Zap do local,
            informando sua localidade!!!
          </p>

          <form
            action="/"
            method="GET"
            className="max-w-3xl mx-auto flex flex-col gap-3 sm:block sm:relative"
          >
            <input
              name="cidade"
              type="text"
              placeholder="Digite sua cidade (ex: Juiz de Fora)"
              defaultValue={searchParams?.cidade ?? ""}
              className="w-full p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl text-slate-800 text-base sm:text-lg outline-none focus:ring-4
                       focus:ring-blue-400 transition-all placeholder:text-white/70"
            />
            <button
              type="submit"
              className="w-full sm:w-auto sm:absolute sm:right-3 sm:top-3 md:right-4 md:top-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg"
            >
              Buscar Cidade
            </button>
          </form>

          {cidadeDetectadaPorGeo ? (
            <p className="mt-2 text-xs text-blue-100">
              Região detectada: <strong>{cidadeDetectadaPorGeo}</strong>
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3">
              <p className="text-blue-100 text-xs uppercase tracking-wider">
                Pontos ativos
              </p>
              <p className="text-white text-2xl font-extrabold">
                {totalPontos}
              </p>
            </div>
            <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3">
              <p className="text-blue-100 text-xs uppercase tracking-wider">
                Categorias
              </p>
              <p className="text-white text-2xl font-extrabold">
                {totalCategorias}
              </p>
            </div>
            <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3">
              <p className="text-blue-100 text-xs uppercase tracking-wider">
                Cidades com ponto
              </p>
              <p className="text-white text-2xl font-extrabold">
                {totalCidades}
              </p>
            </div>
            <Link
              href="/admin/pedidos-ajuda"
              className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 block hover:bg-white/20 transition-colors"
            >
              <p className="text-blue-100 text-xs uppercase tracking-wider">
                Pedidos em aberto
              </p>
              <p className="text-white text-2xl font-extrabold">
                {totalPedidosAbertos}
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-16">
        <div id="mapa-pontos" className="mb-12">
          <MapaWrapper pontos={pontos} />
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 shadow-sm">
            <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
            Pin laranja = ponto inativo
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
          Encontre por categoria
        </h2>

        {categoriaFiltro && (
          <div className="mb-4 flex items-center justify-between gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            <p className="text-sm text-blue-800">
              Filtro ativo: <span className="font-bold">{categoriaFiltro}</span>
            </p>
            <Link
              href={buildCategoryHref()}
              className="text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              Limpar categoria
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
          {categoriasAtalho.map((cat) => {
            const displayName = getDisplayCategoryName(cat.nome);
            const emojiMap: { [key: string]: string } = {
              ALIMENTOS: "🍎",
              ROUPAS: "👕",
              COLCHOES: "🛏️",
              COLCHÕES: "🛏️",
              REMÉDIOS: "💊",
              REMEDIOS: "💊",
              MOVEIS: "🗄️",
              MÓVEIS: "🗄️",
              "ABRIGO ANIMAIS": "🐶🐱",
              "ABRIDO ANIMAIS": "🐶🐱",
              "ALIMENTO ANIMAIS": "🐾",
              "ALIMENTOS ANIMAIS": "🐾",
              ABRIGO: "🏠",
              ABRIDO: "🏠",
              VOLUNTARIO: "🤝",
              VOLUNTÁRIO: "🤝",
              AGUA: "💧",
              ÁGUA: "💧",
              LEITE: "🥛",
              DOCUMENTOS: "📄",
              FRAUDAS: "👶",
              FRALDAS: "👶",
              HIGIENE: "🧼",
              DORMITORIO: "💤",
            };
            const emoji = emojiMap[normalizeCategoryName(displayName)] || "📦";
            const isActiveCategory = categoriaFiltroId
              ? categoriaFiltroId === cat.id
              : categoriaFiltro
                ? normalizeCategoryName(categoriaFiltro) ===
                  normalizeCategoryName(displayName)
                : false;

            return (
              <Link
                href={buildCategoryHref(cat.id)}
                key={cat.id}
                className={`p-4 rounded-2xl shadow-sm border text-center transition-all cursor-pointer group ${
                  isActiveCategory
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-slate-100 hover:shadow-md"
                }`}
              >
                <span className="block text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {emoji}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    isActiveCategory ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {displayName}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-3">
          <h2 className="text-2xl font-bold text-slate-800">
            {cidadeFiltro || categoriaFiltro
              ? `Pontos${cidadeFiltro ? ` em ${cidadeFiltro}` : ""}${
                  categoriaFiltro ? ` • ${categoriaFiltro}` : ""
                }`
              : "Pontos Recentes"}
          </h2>
          <Link
            href="/cadastrar"
            className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-xl font-bold transition-all"
          >
            + Cadastrar Ponto de Ajuda!!!
          </Link>
        </div>

        {pontos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {pontos.map((ponto) => {
              const whatsappUrl = buildWhatsAppUrl(
                ponto.whatsapp ?? ponto.telefone,
              );
              const voluntarioZapUrl = buildWhatsAppUrl(
                ponto.voluntarioContatoAgendamento,
              );
              const instagramUrl = extractInstagramUrl(ponto.detalhes);
              const encerramentoEm =
                timerStatusById.get(ponto.id)?.statusAutoInativarEm ?? null;
              const encerramentoLabel = encerramentoEm
                ? new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  }).format(encerramentoEm)
                : null;

              return (
                <div
                  key={ponto.id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">
                        {ponto.nome}
                      </h3>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                          ponto.statusDoacao === "INATIVO"
                            ? "bg-slate-200 text-slate-700"
                            : ponto.statusDoacao === "ATIVO"
                              ? "bg-blue-50 text-blue-700"
                              : ponto.statusDoacao === "RECEBENDO"
                                ? "bg-amber-50 text-amber-700"
                                : ponto.statusDoacao === "DOANDO_RECEBENDO"
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {ponto.statusDoacao === "INATIVO"
                          ? "INATIVO"
                          : ponto.statusDoacao === "ATIVO"
                            ? "ATIVO"
                            : ponto.statusDoacao === "DOANDO_RECEBENDO"
                              ? "DOANDO/RECEBENDO"
                              : (ponto.statusDoacao ?? "DOANDO")}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm mb-4 flex items-start">
                      <span className="mr-2">📍</span>
                      {ponto.endereco}
                      {ponto.numero ? `, ${ponto.numero}` : ""}, {ponto.cidade}{" "}
                      - {ponto.estado}
                    </p>

                    {encerramentoLabel && (
                      <p className="text-xs text-slate-500 mb-3">
                        ⏱ Encerramento:{" "}
                        <span className="font-semibold">
                          {encerramentoLabel}
                        </span>
                      </p>
                    )}

                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mb-4 text-sm font-semibold text-pink-700 hover:text-pink-800"
                      >
                        📸 Instagram
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {ponto.categorias?.map((pc) => (
                        <span
                          key={pc.categoriaId}
                          className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-tight"
                        >
                          {pc.categoria.nome}
                        </span>
                      ))}
                    </div>

                    {(ponto.voluntarioEspecialidades ||
                      ponto.voluntarioContatoAgendamento ||
                      typeof ponto.voluntarioDisponivel === "boolean") && (
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700 space-y-1">
                        <p className="font-bold text-blue-700">Voluntário</p>
                        {ponto.voluntarioEspecialidades && (
                          <p>
                            <span className="font-semibold">
                              Especialidades:
                            </span>{" "}
                            {ponto.voluntarioEspecialidades}
                          </p>
                        )}
                        {ponto.voluntarioContatoAgendamento && (
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="font-semibold">
                                Contato para agendamento:
                              </span>{" "}
                              {ponto.voluntarioContatoAgendamento}
                            </p>
                            {voluntarioZapUrl && (
                              <a
                                href={voluntarioZapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all"
                              >
                                Zap
                              </a>
                            )}
                          </div>
                        )}
                        {typeof ponto.voluntarioDisponivel === "boolean" && (
                          <p>
                            <span className="font-semibold">
                              Disponível agora:
                            </span>{" "}
                            {ponto.voluntarioDisponivel ? "Sim" : "Não"}
                          </p>
                        )}
                      </div>
                    )}

                    {ponto.fraldasPublico && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-slate-700">
                        <p>
                          <span className="font-bold text-amber-700">
                            Fraldas:
                          </span>{" "}
                          {ponto.fraldasPublico === "ADULTO"
                            ? "Adulto"
                            : "Criança"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-xl font-bold text-sm transition-all"
                      >
                        Chamar no WhatsApp
                      </a>
                    ) : (
                      <span className="bg-slate-200 text-slate-500 text-center py-3 rounded-xl font-bold text-sm cursor-not-allowed">
                        Sem WhatsApp
                      </span>
                    )}
                    <VerNoMapaButton
                      pontoId={ponto.id}
                      disabled={
                        typeof ponto.latitude !== "number" ||
                        typeof ponto.longitude !== "number" ||
                        ponto.latitude === 0 ||
                        ponto.longitude === 0
                      }
                    />
                    <PontoDetalhesButton
                      titulo={ponto.nome}
                      detalhes={ponto.detalhes}
                      fotoPonto={ponto.fotoPonto}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-slate-700">
              Nenhum ponto encontrado
            </h3>
            <p className="text-slate-500 mt-2">
              Tente buscar por outra cidade ou cadastre um novo ponto.
            </p>
            <Link
              href="/cadastrar"
              className="inline-block mt-6 text-blue-600 font-bold underline"
            >
              Seja o primeiro a cadastrar um ponto aqui!
            </Link>
          </div>
        )}

        <section className="mt-2 pb-16">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            Minha rua precisa de atenção
          </h2>
          {interdicoes.length > 0 ? (
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-3">
              <MapaInterdicoesWrapper interdicoes={interdicoes} />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-6 text-slate-500">
              Nenhuma interdição ativa no momento! Esta sabendo de alguma?
              Cadastre-se! E nos ajude a manter a comunidade informada e
              segura!!! 🚧
            </div>
          )}
        </section>
      </section>

      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        {/* <p className="text-slate-400 text-sm">
          © 2026 ondedoar.io - Conectando solidariedade.
          <br />
          Com <span className="text-blue-600">❤</span> por{" "}
          <a
            href="https://www.instagram.com/eduardodeveloper/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            Eduardo Developer
          </a>
        </p> */}
      </footer>
    </main>
  );
}
