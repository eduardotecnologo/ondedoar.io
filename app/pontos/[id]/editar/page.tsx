import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { atualizarPonto } from "@/app/actions/update-ponto";
import CategoriaVoluntarioFields from "@/components/CategoriaVoluntarioFields";
import UFCidadeSelect from "@/components/UFCidadeSelect";
import ClientTimezoneOffsetField from "@/components/ClientTimezoneOffsetField";

type EditarPontoPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EditarPontoPage({
  params,
  searchParams,
}: EditarPontoPageProps) {
  const { id } = await params;
  const query = (await (searchParams ?? {})) as { error?: string };

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
    select: {
      id: true,
      nome: true,
      descricao: true,
      status_doacao: true,
      cep: true,
      endereco: true,
      numero: true,
      cidade: true,
      estado: true,
      latitude: true,
      longitude: true,
      telefone: true,
      whatsapp: true,
      voluntario_especialidades: true,
      voluntario_contato_agendamento: true,
      voluntario_disponivel: true,
      fraldas_publico: true,
      user_id: true,
      ponto_categorias: {
        select: {
          categoria_id: true,
        },
      },
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

  let timerStatus: {
    statusAutoAtivarEm: Date | null;
    statusAutoInativarEm: Date | null;
  } | null = null;

  try {
    const timerRows = await prisma.$queryRaw<
      Array<{
        status_auto_ativar_em: Date | null;
        status_auto_inativar_em: Date | null;
      }>
    >`
      SELECT status_auto_ativar_em, status_auto_inativar_em
      FROM pontos_coleta
      WHERE id = ${ponto.id}::uuid
      LIMIT 1
    `;

    if (timerRows.length > 0) {
      timerStatus = {
        statusAutoAtivarEm: timerRows[0].status_auto_ativar_em,
        statusAutoInativarEm: timerRows[0].status_auto_inativar_em,
      };
    }
  } catch (error) {
    console.warn("Timer automático indisponível na edição:", error);
  }

  const formatDateTimeLocal = (value?: Date | string | null): string => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return formatter.format(date).replace(" ", "T");
  };

  const extractInstagramUrl = (text?: string | null): string => {
    if (!text) return "";
    const match = text.match(
      /(https?:\/\/(?:www\.)?instagram\.com\/[\w\d._\/-]+)/i,
    );
    return match?.[1] ?? "";
  };

  const instagramAtual = extractInstagramUrl(ponto.descricao);
  const descricaoSemInstagram = (ponto.descricao ?? "")
    .replace(
      /\n?Instagram:\s*https?:\/\/(?:www\.)?instagram\.com\/[\w\d._\/-]+\s*/gi,
      "",
    )
    .trim();

  const showError =
    query?.error === "1" ||
    query?.error === "missing_fields" ||
    query?.error === "fraldas_publico" ||
    query?.error === "status_doacao_migration";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Home
          </Link>
        </div>

        {showError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query?.error === "fraldas_publico"
              ? "Selecione se as fraldas são para adulto ou criança."
              : query?.error === "missing_fields"
                ? "Preencha todos os campos obrigatórios (incluindo CEP) para atualizar o ponto."
                : query?.error === "status_doacao_migration"
                  ? "Seu banco (local ou produção) ainda não tem a coluna status_doacao. Rode a migration/SQL de atualização e tente novamente."
                  : "Não foi possível atualizar o ponto. Verifique os dados e tente novamente."}
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
            <ClientTimezoneOffsetField />

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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <UFCidadeSelect
                estadoName="estado"
                cidadeName="cidade"
                defaultEstado={ponto.estado}
                defaultCidade={ponto.cidade}
                estadoRequired
                cidadeRequired
                containerClassName="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                estadoSelectClassName="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                cidadeSelectClassName="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                estadoPlaceholder="Selecione a UF"
                cidadePlaceholder="Selecione a cidade"
              />
              <input
                name="cep"
                required
                defaultValue={ponto.cep ?? ""}
                placeholder="CEP"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <input
                name="whatsapp"
                defaultValue={ponto.whatsapp ?? ""}
                placeholder="WhatsApp"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <input
              name="website"
              type="text"
              defaultValue={instagramAtual}
              placeholder="Instagram (@seuperfil ou link)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />

            <textarea
              name="descricao"
              rows={4}
              defaultValue={descricaoSemInstagram}
              placeholder="Detalhes"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Situação do Ponto
              </label>
              <select
                name="status_doacao"
                defaultValue={ponto.status_doacao ?? "DOANDO"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                <option value="DOANDO">DOANDO</option>
                <option value="DOANDO_RECEBENDO">DOANDO/RECEBENDO</option>
                <option value="RECEBENDO">RECEBENDO</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Ativar automaticamente em
                </label>
                <input
                  name="status_auto_ativar_em"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(
                    timerStatus?.statusAutoAtivarEm,
                  )}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Desativar automaticamente em
                </label>
                <input
                  name="status_auto_inativar_em"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(
                    timerStatus?.statusAutoInativarEm,
                  )}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <CategoriaVoluntarioFields
              categorias={categorias}
              selectedCategoriaIds={[...categoriasSelecionadas]}
              voluntarioDefaults={{
                especialidades: ponto.voluntario_especialidades,
                contatoAgendamento: ponto.voluntario_contato_agendamento,
                disponivel: ponto.voluntario_disponivel,
              }}
              fraldasDefault={{
                publico: ponto.fraldas_publico,
              }}
            />

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
