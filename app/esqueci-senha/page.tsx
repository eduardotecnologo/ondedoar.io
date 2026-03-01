import Link from "next/link";
import { solicitarResetSenha } from "@/app/actions/account";

type EsqueciSenhaPageProps = {
  searchParams?: Promise<{ status?: string; error?: string }>;
};

export default async function EsqueciSenhaPage({
  searchParams,
}: EsqueciSenhaPageProps) {
  const query = (await (searchParams ?? {})) as {
    status?: string;
    error?: string;
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
          <p className="text-blue-100 text-sm mt-2">
            Informe seu e-mail para gerar o link de redefinição
          </p>
        </div>

        <form action={solicitarResetSenha} className="p-8 space-y-6">
          {query.status === "sent" && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">
              Se o e-mail existir na base, um link de redefinição foi gerado.
            </div>
          )}

          {query.error === "missing_email" && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              Informe um e-mail válido.
            </div>
          )}

          {query.error === "unknown" && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              Não foi possível processar sua solicitação agora.
            </div>
          )}

          {query.error === "email_unavailable" && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              O envio de e-mail está indisponível no momento. Tente novamente em
              instantes.
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              E-mail da conta
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            Gerar link de recuperação
          </button>

          <p className="text-center text-slate-500 text-sm">
            <Link
              href="/login"
              className="text-slate-600 font-semibold hover:underline"
            >
              ← Voltar para login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
