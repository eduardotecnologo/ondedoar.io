import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import ConfirmServerActionForm from "@/components/ConfirmServerActionForm";
import { deletarPontoFromForm } from "@/app/actions/delete-ponto";

// Define o tipo retornado com include correto
type PontoWithCategorias = Prisma.PontoColetaGetPayload<{
  include: {
    ponto_categorias: {
      include: { categorias: true };
    };
  };
}>;

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/login?error=auth_required");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // Anotamos o tipo explicitamente aqui
  const meusPontos = (await prisma.pontoColeta.findMany({
    where: { user_id: user?.id },
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
