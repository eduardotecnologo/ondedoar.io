"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TopMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!navRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <nav ref={navRef} className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-lg font-black text-blue-600">
            ondedoar.io
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-expanded={isOpen}
            aria-label="Abrir menu"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className="hidden md:flex items-center justify-between mt-3">
          <a
            href="https://wa.me/5532985132378"
            target="_blank"
            rel="noreferrer"
            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold transition-colors text-xs sm:text-sm border border-green-200"
          >
            💬 Contato
          </a>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link
              href="/admin/observabilidade"
              className="hover:text-blue-600 transition-colors"
            >
              Acessos
            </Link>
            <Link
              href="/pedido-ajuda"
              className="hover:text-blue-600 transition-colors"
            >
              Pedido de Ajuda
            </Link>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
            <a
              href="https://wa.me/5532985132378"
              target="_blank"
              rel="noreferrer"
              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-xl font-bold transition-colors text-sm border border-green-200 w-fit"
            >
              💬 Contato
            </a>
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/pedido-ajuda"
              className="hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pedido de Ajuda
            </Link>
            <Link
              href="/admin/observabilidade"
              className="hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Acessos
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
