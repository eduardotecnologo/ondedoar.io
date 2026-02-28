import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import FlashMessage from "@/components/FlashMessage";
import MapaWrapper from "@/components/MapaWrapper";
import AuthButton from "@/components/AuthButton";
import PontoDetalhesButton from "@/components/PontoDetalhesButton";
import type { Ponto } from "@/types/ponto";

type PontoWithCategorias = Prisma.PontoColetaGetPayload<{
  include: {
    ponto_categorias: {
      include: {
        categorias: true;
      };
    };
  };
}>;

interface HomeProps {
  searchParams?:
    | Promise<{
        cidade?: string;
        categoria?: string;
        categoriaId?: string;
        success?: string;
      }>
    | {
        cidade?: string;
        categoria?: string;
        categoriaId?: string;
        success?: string;
      };
}

export default async function Home(props: HomeProps) {
  // Unwrap searchParams (Next pode passar como Promise)
  const searchParams = await (props.searchParams ?? {});

  const cidadeFiltro = searchParams?.cidade?.trim() || undefined;
  const categoriaFiltroNome = searchParams?.categoria?.trim() || undefined;
  const categoriaFiltroId = searchParams?.categoriaId?.trim() || undefined;

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

  // Busca os pontos (incluir a relação ponto_categorias -> categorias)
  const pontosRaw: PontoWithCategorias[] = await prisma.pontoColeta.findMany({
    where,
    include: {
      ponto_categorias: {
        include: {
          categorias: true, // este é o nome da relação no seu schema
        },
      },
    },
    orderBy: { criado_em: "desc" },
  });

  // Transforma para o formato que os componentes front esperam (types/ponto.ts)
  const pontos: Ponto[] = pontosRaw.map((p) => ({
    id: p.id,
    nome: p.nome,
    detalhes: p.descricao ?? null,
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
  }));

  // Busca as categorias para os atalhos
  const categorias = await prisma.tipoDoacao.findMany({
    orderBy: { nome: "asc" },
  });

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

  const buildWhatsAppUrl = (
    phone: string | null | undefined,
  ): string | null => {
    if (!phone) return null;
    const sanitizedPhone = phone.replace(/\D/g, "");
    if (!sanitizedPhone) return null;
    return `https://wa.me/${sanitizedPhone}`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Link
            href="/"
            className="text-xl font-black text-blue-600 tracking-tighter"
          >
            ondedoar<span className="text-slate-400">.io</span>
          </Link>

          {/* Aqui está a correção: AuthButton + Botão Cadastrar */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <AuthButton />
            <Link
              href="/cadastrar"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-full font-bold transition-all shadow-md text-xs sm:text-sm whitespace-nowrap"
            >
              + Cadastrar Ponto de Ajuda!
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

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
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
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-16">
        <div className="mb-12">
          <MapaWrapper pontos={pontos} />
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
              ABRIGO: "🏠",
              ABRIDO: "🏠",
              VOLUNTARIO: "🤝",
              VOLUNTÁRIO: "🤝",
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
            + Cadastrar Ponto
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
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        Ativo
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm mb-4 flex items-start">
                      <span className="mr-2">📍</span>
                      {ponto.endereco}
                      {ponto.numero ? `, ${ponto.numero}` : ""}, {ponto.cidade}{" "}
                      - {ponto.estado}
                    </p>

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

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-xl font-bold text-sm transition-all"
                      >
                        Chamar no WhatsApp
                      </a>
                    ) : (
                      <span className="flex-1 bg-slate-200 text-slate-500 text-center py-3 rounded-xl font-bold text-sm cursor-not-allowed">
                        Sem WhatsApp
                      </span>
                    )}
                    <PontoDetalhesButton
                      titulo={ponto.nome}
                      detalhes={ponto.detalhes}
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
      </section>

      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        <p className="text-slate-400 text-sm">
          © 2026 ondedoar.io - Conectando solidariedade.
          <br />
          Com <span className="text-blue-600">❤</span> por{" "}
          <span className="text-blue-600">Eduardo Developer</span>
        </p>
      </footer>
    </main>
  );
}
