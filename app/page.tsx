import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import FlashMessage from "@/components/FlashMessage";
import MapaWrapper from "@/components/MapaWrapper";
import AuthButton from "@/components/AuthButton";
import type { Ponto } from "@/types/ponto";

interface HomeProps {
  searchParams?:
    | Promise<{ cidade?: string; success?: string }>
    | { cidade?: string; success?: string };
}

export default async function Home(props: HomeProps) {
  // Unwrap searchParams (Next pode passar como Promise)
  const searchParams = await (props.searchParams ?? {});

  const cidadeFiltro = searchParams?.cidade?.trim() || undefined;

  // Monta filtro condicional
  const where = cidadeFiltro
    ? { cidade: { contains: cidadeFiltro, mode: "insensitive" } }
    : {};

  // Busca os pontos (incluir a relação ponto_categorias -> categorias)
  const pontosRaw = await prisma.pontoColeta.findMany({
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
    endereco: p.endereco,
    cidade: p.cidade ?? null,
    estado: p.estado ?? null,
    whatsapp: p.whatsapp ?? null,
    latitude: typeof p.latitude === "number" ? p.latitude : 0,
    longitude: typeof p.longitude === "number" ? p.longitude : 0,
    categorias: (p.ponto_categorias ?? []).map((pc: any) => ({
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

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-black text-blue-600 tracking-tighter"
          >
            ondedoar<span className="text-slate-400">.io</span>
          </Link>

          {/* Aqui está a correção: AuthButton + Botão Cadastrar */}
          <div className="flex items-center gap-3">
            <AuthButton />
            <Link
              href="/cadastrar"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold transition-all shadow-md text-sm"
            >
              + Cadastrar Ponto
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
            Encontre um ponto de coleta perto de você e faça parte dessa
            corrente do bem. Se você precisa de ajuda, estamos aqui para acolher
            você. 💛
          </p>

          <form action="/" method="GET" className="max-w-3xl mx-auto relative">
            <input
              name="cidade"
              type="text"
              placeholder="Digite sua cidade (ex: Juiz de Fora)"
              defaultValue={searchParams?.cidade ?? ""}
              className="w-full p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl text-slate-800 text-lg outline-none focus:ring-4
                       focus:ring-blue-400 transition-all placeholder:text-white/70"
            />
            <button
              type="submit"
              className="absolute right-3 top-3 md:right-4 md:top-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-16">
        <div className="mb-12">
          <MapaWrapper pontos={pontos} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
          {categorias.slice(0, 6).map((cat) => {
            const emojiMap: { [key: string]: string } = {
              ALIMENTOS: "🍎",
              ROUPAS: "👕",
              COLCHOES: "🛏️",
              REMEDIOS: "💊",
              MOVEIS: "🪑",
              ABRIGO: "🏠",
              HIGIENE: "🧼",
              DORMITORIO: "💤",
            };
            const emoji = emojiMap[cat.nome.toUpperCase()] || "📦";

            return (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-all cursor-pointer group"
              >
                <span className="block text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {emoji}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {cat.nome}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {searchParams?.cidade
              ? `Pontos em ${searchParams.cidade}`
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
            {pontos.map((ponto) => (
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
                    {ponto.endereco}, {ponto.cidade} - {ponto.estado}
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
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <a
                    href={`https://wa.me/${ponto.whatsapp?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    WhatsApp
                  </a>
                  <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
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
        </p>
      </footer>
    </main>
  );
}
