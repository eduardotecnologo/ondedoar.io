"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopMenu() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="text-lg font-black text-blue-600">
            ondedoar.io
          </Link>
          <a
            href="https://wa.me/5532985132378"
            target="_blank"
            rel="noreferrer"
            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold transition-colors text-xs sm:text-sm border border-green-200"
          >
            💬 Contato
          </a>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link
            href="/pedido-ajuda"
            className="hover:text-blue-600 transition-colors"
          >
            Pedido de Ajuda
          </Link>
        </div>
      </nav>
    </header>
  );
}
