import Link from "next/link";
import Image from "next/image";
import FlashMessage from "@/components/FlashMessage";
import MultiImageUploadField from "@/components/MultiImageUploadField";
import {
  cadastrarPessoaEncontrar,
  marcarPessoaComoEncontrada,
} from "@/app/actions/encontrar";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type PessoaItem = {
  id: string;
  nome: string;
  contato: string;
  cidade: string;
  estado: string;
  descricao: string;
  foto_url: string | null;
  status: "DESAPARECIDO" | "ENCONTRADO";
  anonimo: boolean;
  encontrado_por_nome: string | null;
  encontrado_por_anonimo: boolean | null;
  encontrado_em: Date | null;
  criado_em: Date;
};

interface EncontrarPessoasPageProps {
  searchParams?:
    | Promise<{
        success?: string | string[];
        error?: string | string[];
        cidade?: string | string[];
        estado?: string | string[];
        status?: string | string[];
      }>
    | {
        success?: string | string[];
        error?: string | string[];
        cidade?: string | string[];
        estado?: string | string[];
        status?: string | string[];
      };
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

export default async function EncontrarPessoasPage(
  props: EncontrarPessoasPageProps,
) {
  const session = await getServerSession(authOptions);
  const canCadastrar = Boolean(session?.user?.email);

  const rawSearchParams = (await (props.searchParams ?? {})) as {
    success?: string | string[];
    error?: string | string[];
    cidade?: string | string[];
    estado?: string | string[];
    status?: string | string[];
  };

  const success = normalizeParam(rawSearchParams.success);
  const error = normalizeParam(rawSearchParams.error);
  const cidadeFiltro = normalizeParam(rawSearchParams.cidade);
  const estadoFiltro = normalizeParam(rawSearchParams.estado)?.toUpperCase();
  const statusFiltro = normalizeParam(rawSearchParams.status)?.toUpperCase();

  const errorMessage =
    error === "auth_required"
      ? "Você precisa estar logado para realizar esta ação."
      : error === "required"
        ? "Preencha os campos obrigatórios para enviar o cadastro."
        : error === "invalid_photo"
          ? "Envie um arquivo de imagem válido."
          : error === "too_many_photos"
            ? "Você pode enviar no máximo 8 fotos."
            : error === "photo_total_too_large"
              ? "O total das fotos deve ter no máximo 12MB."
              : error === "photo_too_large"
                ? "A foto deve ter no máximo 4MB."
                : error === "attendant_required"
                  ? "Informe seu nome para marcar como encontrado ou selecione a opção anônima."
                  : error === "save"
                    ? "Não foi possível salvar agora. Tente novamente em instantes."
                    : undefined;

  let pessoas: PessoaItem[] = [];
  let indisponivel = false;

  try {
    pessoas = await prisma.$queryRaw<PessoaItem[]>`
      SELECT
        id,
        nome,
        contato,
        cidade,
        estado,
        descricao,
        foto_url,
        status,
        anonimo,
        encontrado_por_nome,
        encontrado_por_anonimo,
        encontrado_em,
        criado_em
      FROM encontrar_pessoas
      ORDER BY criado_em DESC
      LIMIT 80
    `;
  } catch (queryError) {
    indisponivel = true;
    console.error("Erro ao carregar pessoas desaparecidas:", queryError);
  }

  const pessoasFiltradas = pessoas.filter((item) => {
    const cidadeOk = cidadeFiltro
      ? item.cidade.toLowerCase().includes(cidadeFiltro.toLowerCase())
      : true;
    const estadoOk = estadoFiltro
      ? item.estado.toUpperCase() === estadoFiltro
      : true;
    const statusOk =
      statusFiltro && ["DESAPARECIDO", "ENCONTRADO"].includes(statusFiltro)
        ? item.status === statusFiltro
        : true;
    return cidadeOk && estadoOk && statusOk;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      {success === "1" && (
        <FlashMessage type="success" text="Cadastro enviado com sucesso." />
      )}
      {success === "found" && (
        <FlashMessage
          type="success"
          text="Registro marcado como encontrado com sucesso."
        />
      )}
      {errorMessage && <FlashMessage type="error" text={errorMessage} />}

      <section className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Encontrar Pessoas
        </h1>
        <p className="text-slate-600 leading-relaxed mb-6">
          Cadastre pessoas desaparecidas e ajude a comunidade a localizar com
          segurança.
        </p>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm text-amber-800 font-medium">
            Em situação de risco imediato, acione Polícia Militar (190), SAMU
            (192), Bombeiros (193) e Defesa Civil (199).
          </p>
        </div>

        {canCadastrar ? (
          <form
            action={cadastrarPessoaEncontrar}
            className="space-y-4 mb-6"
            encType="multipart/form-data"
          >
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
                  placeholder="Nome da pessoa"
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

            <MultiImageUploadField
              inputName="fotos"
              label="Fotos (opcional, até 8 imagens, 4MB por imagem)"
            />

            <div>
              <label
                htmlFor="descricao"
                className="block text-xs font-semibold text-slate-600 uppercase mb-1"
              >
                Descrição *
              </label>
              <textarea
                id="descricao"
                name="descricao"
                required
                rows={4}
                placeholder="Ex: Última vez visto(a) no bairro X, usando camiseta azul..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="anonimo"
                className="rounded border-slate-300"
              />
              Publicar de forma anônima
            </label>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
            >
              Enviar cadastro
            </button>
          </form>
        ) : (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <p className="text-sm font-medium text-blue-800">
              Para cadastrar pessoa desaparecida, é obrigatório entrar na
              plataforma.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login?from=encontrar-pessoas"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                Entrar
              </Link>
              <Link
                href="/register?from=encontrar-pessoas"
                className="bg-white border border-blue-300 hover:bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                Criar conta
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Voltar para Home
          </Link>
          <Link
            href="/encontrar-animais"
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors"
          >
            Ir para Encontrar Animais
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Registros recentes
        </h2>

        <form
          method="GET"
          className="mb-4 bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <input
            name="cidade"
            placeholder="Filtrar por cidade"
            defaultValue={cidadeFiltro}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
          <input
            name="estado"
            placeholder="UF"
            maxLength={2}
            defaultValue={estadoFiltro}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
          <select
            name="status"
            defaultValue={statusFiltro || ""}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="DESAPARECIDO">Desaparecido</option>
            <option value="ENCONTRADO">Encontrado</option>
          </select>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Filtrar
          </button>
        </form>

        {indisponivel ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-medium text-amber-800">
            Não foi possível carregar os registros agora.
          </div>
        ) : pessoasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-slate-500">
            Nenhum registro encontrado para os filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pessoasFiltradas.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.anonimo ? "Registro anônimo" : item.nome}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                    {item.status === "DESAPARECIDO"
                      ? "Desaparecido"
                      : "Encontrado"}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-2">
                  📍 {item.cidade} - {item.estado}
                </p>
                <p className="text-sm text-slate-600">📞 {item.contato}</p>

                {item.foto_url && (
                  <Image
                    src={item.foto_url}
                    alt="Foto do registro"
                    width={800}
                    height={500}
                    unoptimized
                    className="mt-3 h-44 w-full object-cover rounded-xl border border-slate-100"
                  />
                )}

                {buildWhatsAppUrl(item.contato) && (
                  <a
                    href={buildWhatsAppUrl(item.contato) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    💬 Chamar no WhatsApp
                  </a>
                )}

                {item.status === "ENCONTRADO" ? (
                  <p className="text-sm text-emerald-700 mt-3 font-semibold">
                    ✅ Encontrado por{" "}
                    {item.encontrado_por_anonimo
                      ? "Anônimo"
                      : item.encontrado_por_nome || "Voluntário"}
                  </p>
                ) : !canCadastrar ? (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-800">
                      Entre na plataforma para marcar como encontrado.
                    </p>
                    <Link
                      href="/login?from=encontrar-pessoas"
                      className="inline-flex mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      Entrar
                    </Link>
                  </div>
                ) : (
                  <form
                    action={marcarPessoaComoEncontrada}
                    className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-2"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <label className="block text-xs font-semibold text-emerald-800 uppercase">
                      Quem localizou?
                    </label>
                    <input
                      name="encontrado_por_nome"
                      placeholder="Seu nome"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-200 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-emerald-800">
                      <input
                        type="checkbox"
                        name="encontrado_por_anonimo"
                        className="rounded border-emerald-300"
                      />
                      Quero aparecer como anônimo
                    </label>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
                    >
                      Marcar como Encontrado
                    </button>
                  </form>
                )}

                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
                  {item.descricao}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  Criado em {new Date(item.criado_em).toLocaleString("pt-BR")}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
