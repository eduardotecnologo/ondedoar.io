import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import ConfirmServerActionForm from "@/components/ConfirmServerActionForm";
import { deletarPontoFromForm } from "@/app/actions/delete-ponto";
import { alterarSenha } from "@/app/actions/account";

// Define o tipo retornado com include correto
type PontoWithCategorias = Prisma.PontoColetaGetPayload<{
  include: {
    ponto_categorias: {
      include: { categorias: true };
    };
  };
}>;

interface DashboardPageProps {
  searchParams?:
    | Promise<{ pwd_success?: string; pwd_error?: string }>
    | { pwd_success?: string; pwd_error?: string };
}

const passwordErrorMessages: Record<string, string> = {
  missing_fields: "Preencha todos os campos para alterar a senha.",
  weak_password: "A nova senha deve ter pelo menos 8 caracteres.",
  password_mismatch: "A confirmação da nova senha não confere.",
  wrong_current_password: "A senha atual está incorreta.",
  user_not_found: "Não foi possível validar seu usuário. Faça login novamente.",
  unknown: "Não foi possível alterar a senha agora. Tente novamente.",
};

export default async function DashboardPage(props: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login?error=auth_required");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login?error=auth_required");
  }

  const searchParams = await (props.searchParams ?? {});
  const pwdSuccess = searchParams?.pwd_success === "1";
  const pwdError = searchParams?.pwd_error;
  const pwdErrorMessage =
    pwdError && passwordErrorMessages[pwdError]
      ? passwordErrorMessages[pwdError]
      : null;

  const meusPontos = (await prisma.pontoColeta.findMany({
    where: { user_id: user.id },
    include: {
      ponto_categorias: {
        include: { categorias: true },
      },
    },
    orderBy: { criado_em: "desc" },
  })) as PontoWithCategorias[];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Home
          </Link>
        </div>

        {pwdSuccess && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Senha atualizada com sucesso.
          </div>
        )}

        {pwdErrorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pwdErrorMessage}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Editar Senha
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Atualize sua senha para manter sua conta segura.
          </p>

          <form
            action={alterarSenha}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <input
              name="senhaAtual"
              type="password"
              required
              placeholder="Senha atual"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <input
              name="novaSenha"
              type="password"
              required
              minLength={8}
              placeholder="Nova senha (mín. 8 caracteres)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <input
              name="confirmarNovaSenha"
              type="password"
              required
              minLength={8}
              placeholder="Confirmar nova senha"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />

            <button
              type="submit"
              className="md:col-span-3 w-full md:w-auto justify-self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700"
            >
              Salvar nova senha
            </button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Meus Pontos de Coleta
            </h1>
            <p className="text-slate-500">
              Gerencie os locais que você cadastrou.
            </p>
          </div>
          <Link
            href="/cadastrar"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100"
          >
            + Novo Ponto
          </Link>
        </div>

        {meusPontos.length > 0 ? (
          <div className="grid gap-4">
            {meusPontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">
                    {ponto.nome}
                  </h3>
                  <p className="text-slate-500 text-sm mb-3">
                    📍 {ponto.endereco}, {ponto.cidade}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ponto.ponto_categorias.map((pc) => (
                      <span
                        key={pc.categoria_id}
                        className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg uppercase"
                      >
                        {pc.categorias.nome}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Link
                    href={`/pontos/${ponto.id}/editar`}
                    className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm transition-all text-center"
                  >
                    Editar
                  </Link>
                  <ConfirmServerActionForm
                    action={deletarPontoFromForm}
                    className="inline-block"
                    hiddenInputs={[{ name: "id", value: ponto.id }]}
                    confirmMessage="Tem certeza que deseja excluir?"
                    buttonText="Excluir"
                    pendingText="Excluindo..."
                    buttonClassName="text-red-600 hover:text-red-800 font-bold text-sm disabled:opacity-60"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 mb-6">
              Você ainda não cadastrou nenhum ponto.
            </p>
            <Link
              href="/cadastrar"
              className="text-blue-600 font-bold underline"
            >
              Começar agora
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
