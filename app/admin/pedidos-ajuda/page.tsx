import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { isVerifiedAdminEmail } from "@/lib/admin";
import FlashMessage from "@/components/FlashMessage";
import { atualizarStatusPedidoAjuda } from "@/app/actions/pedido-ajuda";

type PedidoAjudaRow = {
  id: string;
  nome: string;
  contato: string;
  cidade: string;
  estado: string;
  categoria: string;
  descricao: string;
  urgencia: string;
  status: string;
  anonimo: boolean;
  atendido_por_nome: string | null;
  atendido_por_anonimo: boolean | null;
  atendido_em: Date | null;
  criado_em: Date;
};

interface AdminPedidosPageProps {
  searchParams?:
    | Promise<{ success?: string | string[]; error?: string | string[] }>
    | { success?: string | string[]; error?: string | string[] };
}

function normalizeParam(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v.trim() || undefined;
}

export default async function AdminPedidosAjudaPage(
  props: AdminPedidosPageProps,
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.email ||
    !(await isVerifiedAdminEmail(session.user.email))
  ) {
    redirect("/");
  }

  const rawSearchParams = (await (props.searchParams ?? {})) as {
    success?: string | string[];
    error?: string | string[];
  };

  const success = normalizeParam(rawSearchParams.success);
  const error = normalizeParam(rawSearchParams.error);

  let pedidos: PedidoAjudaRow[] = [];
  let tableUnavailable = false;

  try {
    const rows = (await prisma.$queryRaw`
      SELECT
        id,
        nome,
        contato,
        cidade,
        estado,
        categoria,
        descricao,
        urgencia,
        status,
        anonimo,
        atendido_por_nome,
        atendido_por_anonimo,
        atendido_em,
        criado_em
      FROM pedidos_ajuda
      ORDER BY criado_em DESC
      LIMIT 300
    `) as PedidoAjudaRow[];

    pedidos = rows;
  } catch (queryError) {
    console.error("Erro ao consultar pedidos de ajuda:", queryError);
    tableUnavailable = true;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      {success === "1" && (
        <FlashMessage
          type="success"
          text="Status do pedido atualizado com sucesso."
        />
      )}
      {error && (
        <FlashMessage
          type="error"
          text="Não foi possível atualizar agora. Tente novamente."
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Admin
          </Link>
          <Link
            href="/pedido-ajuda"
            className="inline-flex bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            Ver formulário público
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Pedidos de Ajuda
          </h1>
          <p className="text-slate-500">
            Acompanhe solicitações recebidas e atualize o andamento.
          </p>
        </header>

        {tableUnavailable ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm font-medium">
            Tabela de pedidos ainda não disponível no banco. Execute o script
            SQL de criação e atualize a página.
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center text-slate-500">
            Nenhum pedido de ajuda cadastrado até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {pedido.anonimo ? "Pedido anônimo" : pedido.nome}
                    </h2>
                    <p className="text-sm text-slate-600">
                      📍 {pedido.cidade} - {pedido.estado} • 🏷️{" "}
                      {pedido.categoria} • ⚡ {pedido.urgencia}
                    </p>
                    <p className="text-sm text-slate-600">
                      📞 {pedido.contato}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {pedido.descricao}
                    </p>
                    {pedido.status === "ATENDIDO" && (
                      <p className="text-sm font-semibold text-emerald-700">
                        ✅ Atendido por{" "}
                        {pedido.atendido_por_anonimo
                          ? "Anônimo"
                          : pedido.atendido_por_nome || "Voluntário"}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Criado em{" "}
                      {new Date(pedido.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <form
                    action={atualizarStatusPedidoAjuda}
                    className="flex flex-col gap-2 min-w-47.5"
                  >
                    <input type="hidden" name="id" value={pedido.id} />
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={pedido.status}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    >
                      <option value="ABERTO">ABERTO</option>
                      <option value="EM_ATENDIMENTO">EM ATENDIMENTO</option>
                      <option value="ATENDIDO">ATENDIDO</option>
                      <option value="ENCERRADO">ENCERRADO</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Salvar status
                    </button>
                    <span className="text-xs text-slate-500">
                      Atual: {pedido.status}
                    </span>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
