import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { isVerifiedAdminEmail } from "@/lib/admin";

export default async function AcessosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?from=acessos");
  }

  if (await isVerifiedAdminEmail(session.user.email)) {
    redirect("/admin/observabilidade");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900">Acesso restrito</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Seu usuário está autenticado, mas não possui permissão para acessar o
          painel administrativo.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Usuário atual: <strong>{session.user.email}</strong>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Voltar para Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Ir para Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
