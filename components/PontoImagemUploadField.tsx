"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export default function PontoImagemUploadField() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Adicionar imagem (opcional)
      </label>

      <input
        ref={inputRef}
        name="foto_ponto"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          setFile(selectedFile);
        }}
        className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none transition-all shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:font-bold hover:file:bg-blue-700"
      />

      <p className="mt-2 text-xs text-slate-500">
        Essa imagem aparecerá no botão “Ver Detalhes” da Home (máx. 4MB).
      </p>

      {previewUrl && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Pré-visualização
            </p>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Remover
            </button>
          </div>
          <Image
            src={previewUrl}
            alt="Pré-visualização da imagem selecionada"
            width={1200}
            height={800}
            unoptimized
            className="w-full h-auto max-h-72 object-cover rounded-xl border border-slate-200"
          />
        </div>
      )}
    </div>
  );
}
