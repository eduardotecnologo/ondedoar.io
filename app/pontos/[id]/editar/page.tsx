import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { atualizarPonto } from "@/app/actions/update-ponto";

type EditarPontoPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EditarPontoPage({
  params,
  searchParams,
}: EditarPontoPageProps) {
  const { id } = await params;
  const query = await (searchParams ?? {});

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?error=auth_required");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login?error=auth_required");
  }

  const ponto = await prisma.pontoColeta.findUnique({
    where: { id },
    include: {
      ponto_categorias: true,
    },
  });

  if (!ponto) {
    redirect("/dashboard?error=ponto_not_found");
  }

  if (ponto.user_id !== null && ponto.user_id !== user.id) {
    redirect("/dashboard?error=not_allowed");
  }

  const categorias = await prisma.tipoDoacao.findMany({
    orderBy: { nome: "asc" },
  });

  const categoriasSelecionadas = new Set(
    ponto.ponto_categorias.map((item) => item.categoria_id),
  );

  const showError = query?.error === "1" || query?.error === "missing_fields";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {showError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível atualizar o ponto. Verifique os dados e tente novamente.
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-2xl font-bold">Editar Ponto de Coleta</h1>
            <p className="text-blue-100 text-sm mt-1">
              Atualize as informações do seu ponto.
            </p>
          </div>

          <form action={atualizarPonto} className="p-6 space-y-6">
            <input type="hidden" name="id" value={ponto.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nome"
                required
                defaultValue={ponto.nome}
                placeholder="Nome do ponto"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <input
                name="telefone"
                defaultValue={ponto.telefone ?? ""}
                placeholder="Telefone"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="endereco"
                required
                defaultValue={ponto.endereco}
                placeholder="Endereço"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <input
                name="numero"
                required
                defaultValue={ponto.numero}
                placeholder="Número"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="cidade"
                required
                defaultValue={ponto.cidade}
                placeholder="Cidade"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <input
                name="estado"
                required
                maxLength={2}
                defaultValue={ponto.estado}
                placeholder="UF"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <input
                name="whatsapp"
                defaultValue={ponto.whatsapp ?? ""}
                placeholder="WhatsApp"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <textarea
              name="descricao"
              rows={4}
              defaultValue={ponto.descricao ?? ""}
              placeholder="Detalhes"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Categorias</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categorias.map((categoria) => (
                  <label
                    key={categoria.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="categorias"
                      value={categoria.id}
                      defaultChecked={categoriasSelecionadas.has(categoria.id)}
                    />
                    <span>{categoria.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5"
              >
                Salvar alterações
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
