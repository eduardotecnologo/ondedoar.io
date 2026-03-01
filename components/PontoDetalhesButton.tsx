"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function PontoDetalhesButton(props: {
  titulo: string;
  detalhes?: string | null;
  fotoPonto?: string | null;
  fotosPonto?: string[];
}) {
  const [open, setOpen] = useState(false);

  const detalhesLimpos = useMemo(() => {
    const d = (props.detalhes ?? "").trim();
    return d.length > 0 ? d : null;
  }, [props.detalhes]);

  const fotos = useMemo(() => {
    const galeria = (props.fotosPonto ?? []).filter(
      (foto) => typeof foto === "string" && foto.trim().length > 0,
    );

    if (galeria.length > 0) return galeria;

    if (props.fotoPonto && props.fotoPonto.trim().length > 0) {
      return [props.fotoPonto];
    }

    return [];
  }, [props.fotoPonto, props.fotosPonto]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
      >
        Ver Detalhes
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${props.titulo}`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {props.titulo}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Informações do ponto de coleta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="p-6">
              {fotos.length > 0 && (
                <div
                  className={`mb-4 grid gap-3 ${
                    fotos.length > 1 ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {fotos.map((foto, index) => (
                    <img
                      key={`${foto.slice(0, 32)}-${index}`}
                      src={foto}
                      alt={`Imagem ${index + 1} de ${props.titulo}`}
                      className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
                    />
                  ))}
                </div>
              )}

              {detalhesLimpos ? (
                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {detalhesLimpos}
                </p>
              ) : (
                <p className="text-slate-500 text-sm">
                  Nenhum detalhe foi informado para este ponto.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
