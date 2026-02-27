import React from "react";
import Link from "next/link";
import { registerUser } from "@/app/actions/register";

// O "export default" é obrigatório para o Next.js reconhecer a página
export default async function RegisterPage(props: {
  searchParams?: Promise<{ error?: string }> | { error?: string };
}) {
  // No Next.js 15+, searchParams pode vir como objeto ou Promise; normalizamos e tipamos
  const searchParams = (await (props.searchParams ?? {})) as {
    error?: string;
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Criar Conta
          </h1>
          <p className="text-blue-100 text-sm mt-2">
            Cadastre-se para gerenciar seus pontos de coleta no ondedoar.io
          </p>
        </div>

        {/* O formulário chama a Server Action que criamos anteriormente */}
        <form action={registerUser} className="p-8 space-y-6">
          {searchParams.error === "user_exists" && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              Este e-mail já está cadastrado.
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nome Completo
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Seu nome ou nome da ONG"
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="exemplo@email.com"
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            Criar minha conta
          </button>

          <p className="text-center text-slate-500 text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              Fazer Login
            </Link>
          </p>

          <p className="text-center text-slate-500 text-sm">
            <Link
              href="/"
              className="text-slate-600 font-semibold hover:underline"
            >
              ← Voltar para Home
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
