import React from "react";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            Entrar no ondedoar.io
          </h1>
          <p className="text-blue-100 text-sm mt-2">
            Acesse para gerenciar seus pontos de coleta
          </p>
        </div>

        <form
          action="/api/auth/callback/credentials"
          method="POST"
          className="p-8 space-y-6"
        >
          {searchParams.success === "registered" && (
            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-medium border border-green-100">
              Conta criada com sucesso! Faça login abaixo.
            </div>
          )}

          {searchParams.error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              E-mail ou senha incorretos.
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
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
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            Entrar
          </button>

          <p className="text-center text-slate-500 text-sm">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-bold hover:underline"
            >
              Criar conta gratuita
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
