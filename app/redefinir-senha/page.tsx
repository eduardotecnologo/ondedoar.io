import Link from "next/link";
import { redefinirSenhaComToken } from "@/app/actions/account";

type RedefinirSenhaPageProps = {
  searchParams?: Promise<{ token?: string; error?: string }>;
};

export default async function RedefinirSenhaPage({
  searchParams,
}: RedefinirSenhaPageProps) {
  const query = (await (searchParams ?? {})) as {
    token?: string;
    error?: string;
  };
  const token = query.token ?? "";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
          <p className="text-blue-100 text-sm mt-2">
            Crie uma nova senha para continuar
          </p>
        </div>

        <form action={redefinirSenhaComToken} className="p-8 space-y-6">
          <input type="hidden" name="token" value={token} />

          {!token && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              Link inválido. Solicite uma nova recuperação de senha.
            </div>
          )}

          {query.error === "invalid_or_expired" && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              Link inválido ou expirado. Solicite um novo link.
            </div>
          )}

          {query.error === "missing_fields" && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              Preencha todos os campos.
            </div>
          )}

          {query.error === "weak_password" && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              A nova senha deve ter pelo menos 8 caracteres.
            </div>
          )}

          {query.error === "password_mismatch" && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-100">
              A confirmação de senha não confere.
            </div>
          )}

          {query.error === "unknown" && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              Não foi possível redefinir sua senha agora.
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nova senha
            </label>
            <input
              name="novaSenha"
              type="password"
              required
              minLength={8}
              disabled={!token}
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirmar nova senha
            </label>
            <input
              name="confirmarNovaSenha"
              type="password"
              required
              minLength={8}
              disabled={!token}
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all disabled:bg-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={!token}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            Salvar nova senha
          </button>

          <p className="text-center text-slate-500 text-sm">
            <Link
              href="/esqueci-senha"
              className="text-slate-600 font-semibold hover:underline"
            >
              Solicitar novo link
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
