import Link from "next/link";
import FlashMessage from "@/components/FlashMessage";
import {
  cadastrarPedidoAjuda,
  marcarPedidoComoAtendido,
} from "@/app/actions/pedido-ajuda";
import prisma from "@/lib/prisma";

type PedidoAjudaItem = {
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

interface PedidoAjudaPageProps {
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

function buildWhatsAppUrl(contato: string): string | null {
  const sanitized = contato.replace(/\D/g, "");
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}`;
}

export default async function PedidoAjudaPage(props: PedidoAjudaPageProps) {
  const rawSearchParams = (await (props.searchParams ?? {})) as {
    success?: string | string[];
    error?: string | string[];
  };

  const success = normalizeParam(rawSearchParams.success);
  const error = normalizeParam(rawSearchParams.error);

  const errorMessage =
    error === "required"
      ? "Preencha os campos obrigatórios para enviar o pedido."
      : error === "attendant_required"
        ? "Informe seu nome para marcar como atendido ou selecione a opção anônima."
        : error === "save"
          ? "Não foi possível salvar seu pedido agora. Tente novamente em instantes."
          : undefined;

  let pedidos: PedidoAjudaItem[] = [];
  let pedidosIndisponiveis = false;

  try {
    pedidos = await prisma.$queryRaw<PedidoAjudaItem[]>`
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
      LIMIT 60
    `;
  } catch (queryError) {
    pedidosIndisponiveis = true;
    console.error("Erro ao carregar pedidos de ajuda:", queryError);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      {success === "1" && (
        <FlashMessage
          type="success"
          text="Pedido de ajuda enviado com sucesso. Em breve alguém pode entrar em contato."
        />
      )}
      {success === "attended" && (
        <FlashMessage
          type="success"
          text="Pedido marcado como atendido com sucesso."
        />
      )}
      {errorMessage && <FlashMessage type="error" text={errorMessage} />}

      <section className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Pedidos de Ajuda
        </h1>
        <p className="text-slate-600 leading-relaxed mb-6">
          Se você ou alguém próximo precisa de apoio, descreva a necessidade com
          clareza ou procure os pontos de apoio disponíveis na plataforma!!!
        </p>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm text-amber-800 font-medium">
            Em situação de risco imediato, acione os canais de emergência no
            rodapé: Polícia Militar (190), SAMU (192), Bombeiros (193) e Defesa
            Civil (199).
          </p>
        </div>

        <form action={cadastrarPedidoAjuda} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="nome"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                placeholder="Seu nome"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="contato"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Telefone / WhatsApp *
              </label>
              <input
                id="contato"
                name="contato"
                required
                placeholder="(32) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cidade"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Cidade *
              </label>
              <input
                id="cidade"
                name="cidade"
                required
                placeholder="Ex: Juiz de Fora"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Estado (UF) *
              </label>
              <input
                id="estado"
                name="estado"
                required
                maxLength={2}
                placeholder="MG"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="categoria"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Categoria da ajuda
              </label>
              <select
                id="categoria"
                name="categoria"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                defaultValue="OUTRO"
              >
                <option value="ALIMENTOS">Alimentos</option>
                <option value="AGASALHO">Agasalho</option>
                <option value="HIGIENE">Higiene</option>
                <option value="REMEDIO">Remédio</option>
                <option value="ABRIGO">Abrigo</option>
                <option value="DOCUMENTOS">Documentos</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="urgencia"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Urgência
              </label>
              <select
                id="urgencia"
                name="urgencia"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                defaultValue="MEDIA"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="block text-xs font-semibold text-slate-600 uppercase mb-1"
            >
              Descreva o que você precisa *
            </label>
            <textarea
              id="descricao"
              name="descricao"
              required
              rows={4}
              placeholder="Ex: Preciso de colchões e cestas básicas para 4 pessoas..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="anonimo"
              className="rounded border-slate-300"
            />
            Publicar meu pedido de forma anônima
          </label>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Enviar pedido de ajuda
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Ver pontos de apoio
          </Link>
          <Link
            href="/cadastrar"
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Cadastrar ponto de ajuda
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Pedidos recentes
        </h2>

        {pedidosIndisponiveis ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-medium text-amber-800">
            Não foi possível carregar os pedidos agora.
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-slate-500">
            Nenhum pedido cadastrado até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {pedido.anonimo ? "Pedido anônimo" : pedido.nome}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                    {pedido.status}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-2">
                  📍 {pedido.cidade} - {pedido.estado}
                </p>
                <p className="text-sm text-slate-600">
                  🏷️ {pedido.categoria} • ⚡ {pedido.urgencia}
                </p>
                <p className="text-sm text-slate-600">📞 {pedido.contato}</p>

                {buildWhatsAppUrl(pedido.contato) && (
                  <a
                    href={buildWhatsAppUrl(pedido.contato) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    💬 Chamar no WhatsApp
                  </a>
                )}

                {pedido.status === "ATENDIDO" ? (
                  <p className="text-sm text-emerald-700 mt-2 font-semibold">
                    ✅ Atendido por{" "}
                    {pedido.atendido_por_anonimo
                      ? "Anônimo"
                      : pedido.atendido_por_nome || "Voluntário"}
                  </p>
                ) : (
                  <form
                    action={marcarPedidoComoAtendido}
                    className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-2"
                  >
                    <input type="hidden" name="id" value={pedido.id} />
                    <label className="block text-xs font-semibold text-emerald-800 uppercase">
                      Quem atendeu este pedido?
                    </label>
                    <input
                      name="atendido_por_nome"
                      placeholder="Seu nome"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-200 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-emerald-800">
                      <input
                        type="checkbox"
                        name="atendido_por_anonimo"
                        className="rounded border-emerald-300"
                      />
                      Quero aparecer como anônimo
                    </label>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      Marcar como Atendido
                    </button>
                  </form>
                )}

                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
                  {pedido.descricao}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  Criado em {new Date(pedido.criado_em).toLocaleString("pt-BR")}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
