"use client";

import React from "react";
import Image from "next/image";

function buildWhatsAppUrl(contato: string | null | undefined): string | null {
  if (!contato) return null;
  const sanitized = contato.replace(/\D/g, "");
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}`;
}

export default function EncontrarMaisInformacoesButton(props: {
  titulo: string;
  subtitulo?: string | null;
  cidade: string;
  estado: string;
  descricao: string;
  fotoUrl?: string | null;
  fotoUrls?: string[];
  contato?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  const fotos = React.useMemo(() => {
    const galeria = (props.fotoUrls ?? []).filter(
      (foto) => typeof foto === "string" && foto.trim().length > 0,
    );

    if (props.fotoUrl && props.fotoUrl.trim().length > 0) {
      const jaExiste = galeria.includes(props.fotoUrl);
      return jaExiste ? galeria : [props.fotoUrl, ...galeria];
    }

    return galeria;
  }, [props.fotoUrl, props.fotoUrls]);

  const whatsappUrl = React.useMemo(
    () => buildWhatsAppUrl(props.contato),
    [props.contato],
  );

  React.useEffect(() => {
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
        className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
      >
        Mais Informações
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Informações de ${props.titulo}`}
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
                {props.subtitulo && (
                  <p className="text-sm text-slate-600 mt-1">
                    {props.subtitulo}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  📍 {props.cidade} - {props.estado}
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

            <div className="p-6 space-y-4">
              {fotos.length > 0 && (
                <div
                  className={
                    fotos.length > 1
                      ? "grid grid-cols-2 gap-3"
                      : "grid grid-cols-1"
                  }
                >
                  {fotos.map((foto, index) => (
                    <Image
                      key={`${foto.slice(0, 32)}-${index}`}
                      src={foto}
                      alt={`Foto ${index + 1} de ${props.titulo}`}
                      width={900}
                      height={560}
                      unoptimized
                      className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
                    />
                  ))}
                </div>
              )}

              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                {props.descricao}
              </p>

              {props.contato && (
                <p className="text-sm text-slate-600">
                  📞 Contato: {props.contato}
                </p>
              )}

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                >
                  Encontrei, falar no WhatsApp
                </a>
              ) : (
                <p className="text-xs text-slate-500">
                  WhatsApp indisponível para este cadastro.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
