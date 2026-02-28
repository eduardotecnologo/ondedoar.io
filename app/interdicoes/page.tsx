import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import {
  cadastrarRuaInterditada,
  encerrarRuaInterditada,
} from "@/app/actions/interdicoes";
import MapaInterdicoesWrapper from "@/components/MapaInterdicoesWrapper";
import type { Interdicao } from "@/types/interdicao";
import ConfirmServerActionForm from "@/components/ConfirmServerActionForm";

type InterdicoesPageProps = {
  searchParams?:
    | Promise<{ success?: string; error?: string }>
    | { success?: string; error?: string };
};

const errorMap: Record<string, string> = {
  missing_fields:
    "Preencha rua, número de início, número de fim, cidade e estado para cadastrar a interdição.",
  missing_photo: "A foto do motivo é obrigatória.",
  invalid_photo: "Envie um arquivo de imagem válido.",
  photo_too_large: "A foto deve ter no máximo 4MB.",
  invalid_id: "Interdição inválida.",
  not_found: "Interdição não encontrada.",
  not_allowed: "Você não tem permissão para encerrar esta interdição.",
  unknown: "Não foi possível processar sua solicitação agora.",
};

export default async function InterdicoesPage(props: InterdicoesPageProps) {
  const session = await getServerSession(authOptions);
  const query = (await (props.searchParams ?? {})) as {
    success?: string;
    error?: string;
  };

  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      })
    : null;

  const isAdmin = isAdminEmail(user?.email ?? null);

  const interdicoesRaw = await prisma.ruaInterditada.findMany({
    where: { ativa: true },
    include: { user: true },
    orderBy: { criado_em: "desc" },
    take: 100,
  });

  const interdicoes: Interdicao[] = interdicoesRaw.map((item) => ({
    id: item.id,
    rua: item.rua,
    numero: item.numero,
    cidade: item.cidade,
    estado: item.estado,
    referencia: item.referencia,
    motivo: item.motivo,
    fotoMotivo: item.foto_motivo,
    ativa: item.ativa,
    latitude: item.latitude,
    longitude: item.longitude,
    criadoEm: item.criado_em.toISOString(),
    criadoPorEmail: item.user?.email ?? null,
    podeEncerrar: !!user && (isAdmin || item.user_id === user.id),
  }));

  const successMessage =
    query.success === "1"
      ? "Interdição cadastrada com sucesso."
      : query.success === "closed"
        ? "Interdição encerrada com sucesso."
        : null;

  const errorMessage = query.error
    ? errorMap[query.error] || errorMap.unknown
    : null;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            ← Voltar para Home
          </Link>
          {!session?.user?.email && (
            <Link
              href="/register?from=interdicoes"
              className="inline-flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
            >
              Entrar para cadastrar
            </Link>
          )}
        </div>

        <header className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Ruas Interditadas (Colaborativo)
          </h1>
          <p className="text-slate-500 mt-2">
            Cadastre e consulte interdições em tempo real pela comunidade.
          </p>
        </header>

        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {session?.user?.email && (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Cadastrar interdição
            </h2>
            <form
              action={cadastrarRuaInterditada}
              encType="multipart/form-data"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                name="rua"
                required
                placeholder="Rua / Avenida"
                className="md:col-span-2 w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
              />
              <div className="md:col-span-2 grid grid-cols-2 gap-3">
                <input
                  name="numeroInicio"
                  required
                  placeholder="Início"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <input
                  name="numeroFim"
                  required
                  placeholder="Fim"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
              <input
                name="cidade"
                required
                placeholder="Cidade"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <select
                name="estado"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                <option value="" disabled>
                  Selecione a UF
                </option>
                <option value="AC">Acre (AC)</option>
                <option value="AL">Alagoas (AL)</option>
                <option value="AP">Amapá (AP)</option>
                <option value="AM">Amazonas (AM)</option>
                <option value="BA">Bahia (BA)</option>
                <option value="CE">Ceará (CE)</option>
                <option value="DF">Distrito Federal (DF)</option>
                <option value="ES">Espírito Santo (ES)</option>
                <option value="GO">Goiás (GO)</option>
                <option value="MA">Maranhão (MA)</option>
                <option value="MT">Mato Grosso (MT)</option>
                <option value="MS">Mato Grosso do Sul (MS)</option>
                <option value="MG">Minas Gerais (MG)</option>
                <option value="PA">Pará (PA)</option>
                <option value="PB">Paraíba (PB)</option>
                <option value="PR">Paraná (PR)</option>
                <option value="PE">Pernambuco (PE)</option>
                <option value="PI">Piauí (PI)</option>
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="RN">Rio Grande do Norte (RN)</option>
                <option value="RS">Rio Grande do Sul (RS)</option>
                <option value="RO">Rondônia (RO)</option>
                <option value="RR">Roraima (RR)</option>
                <option value="SC">Santa Catarina (SC)</option>
                <option value="SP">São Paulo (SP)</option>
                <option value="SE">Sergipe (SE)</option>
                <option value="TO">Tocantins (TO)</option>
              </select>
              <input
                name="referencia"
                placeholder="Referência (opcional)"
                className="md:col-span-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <textarea
                name="motivo"
                rows={3}
                placeholder="Motivo da interdição (opcional)"
                className="md:col-span-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Foto do motivo (obrigatória)
                </label>
                <input
                  name="foto"
                  type="file"
                  required
                  accept="image/*"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-white file:font-bold hover:file:bg-red-700"
                />
              </div>
              <button
                type="submit"
                className="md:col-span-2 w-full md:w-auto justify-self-start rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 transition-all"
              >
                Cadastrar interdição
              </button>
            </form>
          </section>
        )}

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
          <MapaInterdicoesWrapper interdicoes={interdicoes} />
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Interdições ativas
          </h2>
          {interdicoes.length === 0 ? (
            <p className="text-slate-500">
              Nenhuma interdição ativa cadastrada.
            </p>
          ) : (
            <div className="space-y-3">
              {interdicoes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-red-700 flex items-center gap-2">
                      <span aria-hidden>🚧</span>
                      {item.rua}
                      {item.numero ? `, ${item.numero}` : ""}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.cidade} - {item.estado}
                    </p>
                    {item.referencia && (
                      <p className="text-sm text-slate-600">
                        Referência: {item.referencia}
                      </p>
                    )}
                    {item.motivo && (
                      <p className="text-sm text-slate-600">
                        Motivo: {item.motivo}
                      </p>
                    )}
                    {item.fotoMotivo && (
                      <img
                        src={item.fotoMotivo}
                        alt={`Foto da interdição em ${item.rua}`}
                        className="mt-3 h-24 w-full max-w-[220px] rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>

                  {item.podeEncerrar && (
                    <ConfirmServerActionForm
                      action={encerrarRuaInterditada}
                      hiddenInputs={[{ name: "id", value: item.id }]}
                      confirmMessage="Deseja encerrar esta interdição?"
                      buttonText="Encerrar"
                      pendingText="Encerrando..."
                      className="w-full md:w-auto"
                      buttonClassName="w-full md:w-auto rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
