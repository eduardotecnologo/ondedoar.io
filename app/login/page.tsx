"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrapLoginState() {
      const params = new URLSearchParams(window.location.search);
      const hasResetSuccess = params.get("reset") === "success";

      const success = params.get("success");
      const errorParam = params.get("error");

      let nextSuccessMessage: string | null = null;
      if (success === "registered") {
        nextSuccessMessage =
          "Conta criada com sucesso. Faça login para continuar.";
      } else if (success === "password_created") {
        nextSuccessMessage =
          "Senha criada com sucesso para seu usuário existente. Faça login.";
      }

      const providers = await getProviders();
      const hasGoogleProvider = Boolean(providers?.google);

      if (!active) return;

      setResetSuccess(hasResetSuccess);
      setSuccessMessage(nextSuccessMessage);
      setGoogleAvailable(hasGoogleProvider);

      if (errorParam && errorParam.toLowerCase().includes("oauth")) {
        setError(
          "Não foi possível entrar com Google agora. Verifique a configuração e tente novamente.",
        );
      }
    }

    bootstrapLoginState();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // O signIn do lado do cliente resolve o erro de POST e CSRF automaticamente
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoadingGoogle(true);
    const result = await signIn("google", {
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("Não foi possível entrar com Google. Tente novamente.");
      setLoadingGoogle(false);
      return;
    }

    if (result?.url) {
      router.push(result.url);
      return;
    }

    setError("Login com Google indisponível no momento.");
    setLoadingGoogle(false);
  }

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

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {resetSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100">
              Senha redefinida com sucesso. Faça login com sua nova senha.
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
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
            disabled={loading || loadingGoogle}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || loadingGoogle || !googleAvailable}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl transition-all border border-slate-200 disabled:opacity-50"
          >
            {!googleAvailable
              ? "Google indisponível"
              : loadingGoogle
                ? "Conectando com Google..."
                : "Entrar com Google"}
          </button>

          <p className="text-center text-sm">
            <Link
              href="/esqueci-senha"
              className="text-blue-600 font-bold hover:underline"
            >
              Esqueci minha senha
            </Link>
          </p>

          <p className="text-center text-slate-500 text-sm">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-bold hover:underline"
            >
              Criar conta gratuita
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
