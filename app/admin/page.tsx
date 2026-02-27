import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  criarCategoriaAdmin,
  deletarCategoriaAdmin,
  deletarPontoAdmin,
  deletarUsuarioAdmin,
} from "@/app/actions/admin";
import type { Prisma } from "@prisma/client";
import ConfirmServerActionForm from "@/components/ConfirmServerActionForm";

type PontoWithRelations = Prisma.PontoColetaGetPayload<{
  include: {
    ponto_categorias: { include: { categorias: true } };
    user: true;
  };
}>;

type UserWithCount = Prisma.UserGetPayload<{
  include: { _count: { select: { pontos: true } } };
}>;

type CategoriaWithCount = Prisma.TipoDoacaoGetPayload<{
  include: { _count: { select: { ponto_categorias: true } } };
}>;

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

interface AdminPageProps {
  searchParams?:
    | Promise<{
        cidade?: string | string[];
        categoria?: string | string[];
        usuario?: string | string[];
        cat_error?: string | string[];
        cat_success?: string | string[];
      }>
    | {
        cidade?: string | string[];
        categoria?: string | string[];
        usuario?: string | string[];
        cat_error?: string | string[];
        cat_success?: string | string[];
      };
}

function normalizeParam(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v.trim() || undefined;
}

export default async function AdminPage(props: AdminPageProps) {
  const rawSearchParams = (await (props.searchParams ?? {})) as {
    cidade?: string | string[];
    categoria?: string | string[];
    usuario?: string | string[];
    cat_error?: string | string[];
    cat_success?: string | string[];
  };
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const cidadeFiltro = normalizeParam(rawSearchParams.cidade);
  const categoriaFiltro = normalizeParam(rawSearchParams.categoria);
  const usuarioFiltro = normalizeParam(rawSearchParams.usuario);
  const catError = normalizeParam(rawSearchParams.cat_error);
  const catSuccess = normalizeParam(rawSearchParams.cat_success);

  const wherePonto: Prisma.PontoColetaWhereInput = {
    ...(cidadeFiltro && {
      cidade: { contains: cidadeFiltro, mode: "insensitive" },
    }),
    ...(usuarioFiltro && {
      user: {
        email: { contains: usuarioFiltro, mode: "insensitive" },
      },
    }),
    ...(categoriaFiltro && {
      ponto_categorias: {
        some: {
          categorias: {
            nome: { contains: categoriaFiltro, mode: "insensitive" },
          },
        },
      },
    }),
  };

  const [pontos, usuarios, categorias] = await Promise.all([
    prisma.pontoColeta.findMany({
      where: wherePonto,
      include: {
        ponto_categorias: { include: { categorias: true } },
        user: true,
      },
      orderBy: { criado_em: "desc" },
    }) as Promise<PontoWithRelations[]>,
    prisma.user.findMany({
      include: {
        _count: { select: { pontos: true } },
      },
      orderBy: { criado_em: "desc" },
    }) as Promise<UserWithCount[]>,
    prisma.tipoDoacao.findMany({
      include: {
        _count: { select: { ponto_categorias: true } },
      },
      orderBy: { nome: "asc" },
    }) as Promise<CategoriaWithCount[]>,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Home
          </Link>
        </div>

        <header className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Área Administrativa
              </h1>
              <p className="text-slate-500">
                Gerencie todos os pontos e usuários da plataforma.
              </p>
            </div>
          </div>

          {/* Filtros */}
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Cidade
              </label>
              <input
                name="cidade"
                placeholder="Ex: Juiz de Fora"
                defaultValue={cidadeFiltro}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Categoria
              </label>
              <input
                name="categoria"
                placeholder="Ex: ALIMENTOS"
                defaultValue={categoriaFiltro}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Usuário (e-mail)
              </label>
              <div className="flex gap-2">
                <input
                  name="usuario"
                  placeholder="admin@exemplo.com"
                  defaultValue={usuarioFiltro}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold uppercase tracking-wide hover:bg-blue-700 transition-colors"
                >
                  Filtrar
                </button>
              </div>
            </div>
          </form>
        </header>

        {pontos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <p className="text-slate-500">
              Nenhum ponto cadastrado até o momento.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ponto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Local
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Categorias
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {pontos.map((ponto) => (
                    <tr key={ponto.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-semibold text-slate-900">
                          {ponto.nome}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Criado em{" "}
                          {ponto.criado_em
                            ? new Date(ponto.criado_em).toLocaleString("pt-BR")
                            : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {ponto.endereco}
                        <br />
                        <span className="text-xs text-slate-500">
                          {ponto.cidade} - {ponto.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {ponto.ponto_categorias.map((pc) => (
                            <span
                              key={pc.categoria_id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                            >
                              {pc.categorias.nome}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {ponto.user?.email ?? (
                          <span className="text-slate-400 italic">
                            Anônimo / importado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-right text-sm">
                        <ConfirmServerActionForm
                          action={deletarPontoAdmin}
                          className="inline-block"
                          hiddenInputs={[{ name: "id", value: ponto.id }]}
                          confirmMessage="Tem certeza que deseja excluir este ponto? Esta ação não pode ser desfeita."
                          buttonText="Remover"
                          pendingText="Removendo..."
                          buttonClassName="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gestão de usuários */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Usuários cadastrados
          </h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {usuarios.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Nenhum usuário cadastrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pontos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {usuarios.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-4 text-sm text-slate-800">
                          <div className="font-semibold">
                            {user.nome || "Sem nome"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.email || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {user.criado_em
                            ? new Date(user.criado_em).toLocaleString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-slate-700">
                          {user._count.pontos}
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <ConfirmServerActionForm
                            action={deletarUsuarioAdmin}
                            className="inline-block"
                            hiddenInputs={[{ name: "id", value: user.id }]}
                            confirmMessage="Tem certeza que deseja remover este usuário e todos os pontos cadastrados por ele?"
                            buttonText="Remover usuário"
                            pendingText="Removendo..."
                            buttonClassName="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-60"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Gestão de categorias */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Categorias (tipos de doação)
          </h2>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Cadastre novas categorias e remova categorias indevidas.
                </p>
                {catSuccess === "1" && (
                  <div className="mt-3 text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    Categoria cadastrada com sucesso.
                  </div>
                )}
                {catError && (
                  <div className="mt-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    Não foi possível cadastrar a categoria (verifique o nome ou
                    se já existe).
                  </div>
                )}
              </div>

              <form
                action={criarCategoriaAdmin}
                className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:max-w-2xl"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Nome (ex: ALIMENTOS)
                  </label>
                  <input
                    name="nome"
                    required
                    placeholder="ALIMENTOS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Ícone (opcional)
                  </label>
                  <input
                    name="icone"
                    placeholder="🍎"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold uppercase tracking-wide hover:bg-blue-700 transition-colors"
                  >
                    Cadastrar categoria
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ícone
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Vínculos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {cat.nome}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {cat.icone || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-700">
                        {cat._count.ponto_categorias}
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        <ConfirmServerActionForm
                          action={deletarCategoriaAdmin}
                          className="inline-block"
                          hiddenInputs={[{ name: "id", value: cat.id }]}
                          confirmMessage={`Remover a categoria "${cat.nome}"? Isso vai remover ${cat._count.ponto_categorias} vínculo(s) com pontos.`}
                          buttonText="Remover"
                          pendingText="Removendo..."
                          buttonClassName="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
