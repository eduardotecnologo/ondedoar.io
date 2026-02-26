"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading")
    return (
      <div className="w-20 h-8 bg-slate-200 animate-pulse rounded-xl"></div>
    );

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-all"
        >
          Meu Painel
        </Link>
        <button
          onClick={() => signOut()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-all"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-100"
    >
      Entrar
    </Link>
  );
}
