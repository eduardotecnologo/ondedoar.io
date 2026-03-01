"use client";

import React from "react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import UseMyLocationButton from "@/components/UseMyLocationButton";

export default function HomeMobileMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="lg:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Abrir menu"
        className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 h-0.5 w-5 bg-slate-700 transition-all duration-200 ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 h-0.5 w-5 bg-slate-700 transition-all duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-5 bg-slate-700 transition-all duration-200 ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-xl p-3 z-50 space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div onClick={() => setOpen(false)}>
                <UseMyLocationButton variant="compact" />
              </div>
              <div onClick={() => setOpen(false)}>
                <AuthButton />
              </div>
              <Link
                href="/pedido-ajuda"
                onClick={() => setOpen(false)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-emerald-200 text-center"
              >
                🤝 Preciso de Ajuda
              </Link>
              <Link
                href="/encontrar-pessoas"
                onClick={() => setOpen(false)}
                className="bg-violet-50 hover:bg-violet-100 text-violet-700 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-violet-200 text-center"
              >
                🧍 Encontrar Pessoas
              </Link>
              <Link
                href="/encontrar-animais"
                onClick={() => setOpen(false)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-amber-200 text-center"
              >
                🐾 Encontrar Animais
              </Link>
              <Link
                href="/interdicoes"
                onClick={() => setOpen(false)}
                className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-red-200 text-center"
              >
                🚧 Riscos / Interdições
              </Link>
              <Link
                href="/admin/observabilidade"
                onClick={() => setOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-slate-200 text-center"
              >
                🔐 Acessos
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
