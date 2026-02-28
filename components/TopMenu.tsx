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
        <Link href="/" className="text-lg font-black text-blue-600">
          ondedoar.io
        </Link>
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
