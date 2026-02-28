"use client";

import { useMemo, useState } from "react";

type Categoria = {
  id: string;
  nome: string;
};

type Props = {
  categorias: Categoria[];
  selectedCategoriaIds?: string[];
  voluntarioDefaults?: {
    especialidades?: string | null;
    contatoAgendamento?: string | null;
    disponivel?: boolean | null;
  };
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export default function CategoriaVoluntarioFields({
  categorias,
  selectedCategoriaIds = [],
  voluntarioDefaults,
}: Props) {
  const [selectedIds, setSelectedIds] =
    useState<string[]>(selectedCategoriaIds);

  const categoriaVoluntarioId = useMemo(() => {
    const found = categorias.find((categoria) => {
      const normalized = normalize(categoria.nome);
      return normalized === "VOLUNTARIO" || normalized === "VOLUNTARIOS";
    });

    return found?.id;
  }, [categorias]);

  const voluntarioSelecionado =
    !!categoriaVoluntarioId && selectedIds.includes(categoriaVoluntarioId);

  const toggleCategoria = (categoriaId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(categoriaId)) return prev;
        return [...prev, categoriaId];
      }

      return prev.filter((id) => id !== categoriaId);
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3">
        O que este ponto aceita?
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categorias.map((categoria) => {
          const checked = selectedIds.includes(categoria.id);

          return (
            <label
              key={categoria.id}
              className="flex items-center p-4 border-2 border-slate-200 rounded-2xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <input
                type="checkbox"
                name="categorias"
                value={categoria.id}
                checked={checked}
                onChange={(event) =>
                  toggleCategoria(categoria.id, event.target.checked)
                }
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-3"
              />
              <span className="font-medium text-slate-700 group-hover:text-blue-700">
                {categoria.nome}
              </span>
            </label>
          );
        })}
      </div>

      {voluntarioSelecionado && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-4">
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
            Dados do Voluntário
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Especialidades
              </label>
              <input
                name="voluntario_especialidades"
                type="text"
                defaultValue={voluntarioDefaults?.especialidades ?? ""}
                placeholder="Ex: Enfermagem, Psicologia, Reforço escolar"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contato para agendamento
              </label>
              <input
                name="voluntario_contato_agendamento"
                type="text"
                defaultValue={voluntarioDefaults?.contatoAgendamento ?? ""}
                placeholder="Telefone, WhatsApp ou e-mail"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <input
              name="voluntario_disponivel"
              type="checkbox"
              value="1"
              defaultChecked={Boolean(voluntarioDefaults?.disponivel)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 font-medium">
              Disponível neste momento
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
