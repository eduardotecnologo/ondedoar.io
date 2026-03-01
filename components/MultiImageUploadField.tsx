"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export default function MultiImageUploadField(props: {
  inputName: string;
  label: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const syncInputFiles = (nextFiles: File[]) => {
    if (!inputRef.current) return;

    if (nextFiles.length === 0) {
      inputRef.current.value = "";
      return;
    }

    const dataTransfer = new DataTransfer();
    for (const file of nextFiles) {
      dataTransfer.items.add(file);
    }
    inputRef.current.files = dataTransfer.files;
  };

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrls]);

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
        {props.label}
      </label>

      <input
        ref={inputRef}
        name={props.inputName}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          const selectedFiles = Array.from(event.target.files ?? []);
          if (selectedFiles.length === 0) return;

          setFiles((prev) => {
            const merged = [...prev, ...selectedFiles];
            syncInputFiles(merged);
            return merged;
          });
        }}
        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm outline-none transition-all shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:font-bold hover:file:bg-blue-700"
      />

      <p className="mt-2 text-xs text-slate-500">
        Você pode selecionar várias vezes para adicionar mais imagens à galeria.
      </p>

      {previewUrls.length > 0 && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Pré-visualização {previewUrls.length > 1 ? "(galeria)" : ""}
            </p>
            <span className="text-[11px] font-semibold text-slate-500">
              Total: {previewUrls.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                syncInputFiles([]);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Remover
            </button>
          </div>

          <div
            className={
              previewUrls.length > 1
                ? "grid grid-cols-2 gap-3"
                : "grid grid-cols-1"
            }
          >
            {previewUrls.map((previewUrl, index) => (
              <div key={`${previewUrl}-${index}`} className="relative">
                <button
                  type="button"
                  aria-label={`Remover imagem ${index + 1}`}
                  onClick={() => {
                    setFiles((prev) => {
                      const next = prev.filter(
                        (_, fileIndex) => fileIndex !== index,
                      );
                      syncInputFiles(next);
                      return next;
                    });
                  }}
                  className="absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white text-sm font-black hover:bg-black"
                >
                  ×
                </button>
                <Image
                  src={previewUrl}
                  alt={`Pré-visualização da imagem ${index + 1}`}
                  width={1200}
                  height={800}
                  unoptimized
                  className="w-full h-auto max-h-72 object-cover rounded-xl border border-slate-200"
                />
                <p className="mt-1 text-[11px] font-semibold text-slate-600 text-center">
                  Imagem {index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
