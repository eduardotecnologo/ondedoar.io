"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type UFOption = {
  sigla: string;
  nome: string;
};

const ESTADOS_BRASIL: UFOption[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

type UFCidadeSelectProps = {
  estadoName: string;
  cidadeName: string;
  defaultEstado?: string | null;
  defaultCidade?: string | null;
  estadoRequired?: boolean;
  cidadeRequired?: boolean;
  showLabels?: boolean;
  estadoLabel?: ReactNode;
  cidadeLabel?: ReactNode;
  labelClassName?: string;
  containerClassName?: string;
  estadoSelectClassName: string;
  cidadeSelectClassName: string;
  estadoWrapperClassName?: string;
  cidadeWrapperClassName?: string;
  estadoPlaceholder?: string;
  cidadePlaceholder?: string;
};

export default function UFCidadeSelect({
  estadoName,
  cidadeName,
  defaultEstado,
  defaultCidade,
  estadoRequired = false,
  cidadeRequired = false,
  showLabels = false,
  estadoLabel = "Estado",
  cidadeLabel = "Cidade",
  labelClassName = "block text-sm font-medium text-slate-700 mb-2",
  containerClassName = "grid grid-cols-1 md:grid-cols-2 gap-4",
  estadoSelectClassName,
  cidadeSelectClassName,
  estadoWrapperClassName,
  cidadeWrapperClassName,
  estadoPlaceholder = "Selecione a UF",
  cidadePlaceholder = "Selecione a cidade",
}: UFCidadeSelectProps) {
  const [estado, setEstado] = useState(
    (defaultEstado ?? "").trim().toUpperCase(),
  );
  const [cidade, setCidade] = useState((defaultCidade ?? "").trim());
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    if (!estado) {
      setCidades([]);
      setLoadingCidades(false);
      return;
    }

    let ignore = false;

    async function loadCidades() {
      setLoadingCidades(true);

      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`,
        );

        if (!response.ok) {
          if (!ignore) setCidades([]);
          return;
        }

        const payload = (await response.json()) as Array<{ nome?: string }>;
        const nomesCidades = payload
          .map((item) => (item.nome ?? "").trim())
          .filter((nome) => nome.length > 0)
          .sort((a, b) => a.localeCompare(b, "pt-BR"));

        if (!ignore) {
          setCidades(nomesCidades);
        }
      } catch {
        if (!ignore) setCidades([]);
      } finally {
        if (!ignore) setLoadingCidades(false);
      }
    }

    loadCidades();

    return () => {
      ignore = true;
    };
  }, [estado]);

  const cidadeNaoListada = useMemo(() => {
    if (!cidade) return null;
    return cidades.includes(cidade) ? null : cidade;
  }, [cidade, cidades]);

  return (
    <div className={containerClassName}>
      <div className={estadoWrapperClassName}>
        {showLabels && <label className={labelClassName}>{estadoLabel}</label>}
        <select
          name={estadoName}
          required={estadoRequired}
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value);
            setCidade("");
          }}
          className={estadoSelectClassName}
        >
          <option value="" disabled>
            {estadoPlaceholder}
          </option>
          {ESTADOS_BRASIL.map((item) => (
            <option key={item.sigla} value={item.sigla}>
              {item.nome} ({item.sigla})
            </option>
          ))}
        </select>
      </div>

      <div className={cidadeWrapperClassName}>
        {showLabels && <label className={labelClassName}>{cidadeLabel}</label>}
        <select
          name={cidadeName}
          required={cidadeRequired}
          value={cidade}
          onChange={(event) => setCidade(event.target.value)}
          disabled={!estado || loadingCidades}
          className={cidadeSelectClassName}
        >
          <option value="" disabled>
            {!estado
              ? "Selecione uma UF primeiro"
              : loadingCidades
                ? "Carregando cidades..."
                : cidadePlaceholder}
          </option>
          {cidadeNaoListada && (
            <option value={cidadeNaoListada}>{cidadeNaoListada}</option>
          )}
          {cidades.map((nomeCidade) => (
            <option key={nomeCidade} value={nomeCidade}>
              {nomeCidade}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
