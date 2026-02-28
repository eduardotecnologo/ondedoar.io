import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { cadastrarPonto } from "@/app/actions/pontos";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import CategoriaVoluntarioFields from "@/components/CategoriaVoluntarioFields";
import UFCidadeSelect from "@/components/UFCidadeSelect";

interface PageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}
export default async function CadastrarPontoPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?error=auth_required");
  }
  const categorias = await prisma.tipoDoacao.findMany({
    orderBy: { nome: "asc" },
  });

  const resolvedParams = searchParams ? await searchParams : undefined;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {resolvedParams?.error === "1" && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">⚠</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Erro no cadastro</h3>
                <p className="text-sm text-red-700">
                  Houve um problema ao salvar. Verifique os dados e tente
                  novamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {resolvedParams?.error === "no_category" && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">
                  Selecione ao menos uma categoria
                </h3>
                <p className="text-sm text-amber-700">
                  Marque pelo menos um item em “O que este ponto aceita?” para
                  concluir o cadastro.
                </p>
              </div>
            </div>
          </div>
        )}

        {resolvedParams?.error === "fraldas_publico" && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">
                  Informe o tipo de fraldas
                </h3>
                <p className="text-sm text-amber-700">
                  Para a categoria FRAUDAS, selecione se é para adulto ou
                  criança.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              Cadastrar Ponto de Coleta
            </h1>
            <p className="text-blue-100 leading-relaxed">
              Ajude a conectar quem quer doar com quem precisa receber. Todos os
              dados são públicos e ajudam a comunidade.
            </p>
          </div>

          {/* Formulário */}
          <form action={cadastrarPonto} className="p-8 space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Informações:
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome do Ponto / ONG <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nome"
                    required
                    type="text"
                    placeholder="Ex: Centro de Apoio Esperança"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone/WhatsApp
                  </label>
                  <input
                    name="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Endereço Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="endereco"
                    required
                    type="text"
                    placeholder="Rua das Flores, Bairro Centro"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="numero"
                    required
                    type="text"
                    placeholder="123"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UFCidadeSelect
                  estadoName="estado"
                  cidadeName="cidade"
                  estadoRequired
                  cidadeRequired
                  showLabels
                  estadoLabel={
                    <>
                      Estado (UF) <span className="text-red-500">*</span>
                    </>
                  }
                  cidadeLabel={
                    <>
                      Cidade <span className="text-red-500">*</span>
                    </>
                  }
                  labelClassName="block text-sm font-medium text-slate-700 mb-2"
                  containerClassName="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                  estadoSelectClassName="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  cidadeSelectClassName="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                  estadoPlaceholder="Selecione a UF"
                  cidadePlaceholder="Selecione a cidade"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="cep"
                    required
                    type="text"
                    placeholder="01234-567"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Situação do Ponto <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 bg-white">
                    <input
                      type="radio"
                      name="status_doacao"
                      value="DOANDO"
                      required
                      defaultChecked
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      DOANDO
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 bg-white">
                    <input
                      type="radio"
                      name="status_doacao"
                      value="DOANDO_RECEBENDO"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      DOANDO/RECEBENDO
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 bg-white">
                    <input
                      type="radio"
                      name="status_doacao"
                      value="RECEBENDO"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      RECEBENDO
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 bg-white">
                    <input
                      type="radio"
                      name="status_doacao"
                      value="ATIVO"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      ATIVO
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 bg-white">
                    <input
                      type="radio"
                      name="status_doacao"
                      value="INATIVO"
                      required
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      INATIVO
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Categorias */}
            <CategoriaVoluntarioFields categorias={categorias} />

            {/* Horário e Observações */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Informações Adicionais
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detalhes (opcional)
                </label>
                <textarea
                  name="descricao"
                  rows={4}
                  placeholder="Ex: Recebemos doações apenas de segunda a sexta. Levar na portaria. Preferência por roupas infantis!"
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm resize-y"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Esse texto aparece no botão “Ver Detalhes” na página inicial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horário de Funcionamento
                  </label>
                  <input
                    name="horario"
                    type="text"
                    placeholder="Seg-Sex 9h às 17h"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Site ou Redes Sociais
                  </label>
                  <input
                    name="website"
                    type="text"
                    placeholder="@suaong ou https://instagram.com/suaong"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ativar automaticamente em
                  </label>
                  <input
                    name="status_auto_ativar_em"
                    type="datetime-local"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Desativar automaticamente em
                  </label>
                  <input
                    name="status_auto_inativar_em"
                    type="datetime-local"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="submit"
                className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-[0.98] text-lg"
              >
                📍 Cadastrar Ponto
              </button>
              <Link
                href="/"
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-2xl shadow-sm hover:shadow-md transition-all text-lg flex items-center justify-center"
              >
                ← Voltar para Home
              </Link>
            </div>

            <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              <p>
                Os dados cadastrados ficam públicos para ajudar quem quer doar.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
