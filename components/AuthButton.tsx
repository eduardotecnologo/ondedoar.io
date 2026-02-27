"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  if (status === "loading") {
    return (
      <div className="w-20 h-8 bg-slate-200 animate-pulse rounded-xl"></div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Link
            href="/admin"
            className="text-xs font-extrabold text-red-600 hover:text-red-700 uppercase tracking-wide px-3 py-1.5 rounded-full border border-red-100 bg-red-50 hover:bg-red-100 transition-all"
          >
            Admin
          </Link>
        )}
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
