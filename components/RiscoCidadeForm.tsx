"use client";

import React from "react";

export default function RiscoCidadeForm({
  defaultCidade,
  defaultUf,
}: {
  defaultCidade: string;
  defaultUf: string;
}) {
  const [cidade, setCidade] = React.useState(defaultCidade);
  const [uf, setUf] = React.useState(defaultUf);
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "error" | "outside"
  >("idle");
  const [locationDetected, setLocationDetected] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const autoSubmittedRef = React.useRef(false);

  const loadCurrentLocation = React.useCallback((autoSubmit: boolean) => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lon: String(position.coords.longitude),
          });

          const response = await fetch(
            `/api/geocode/reverse?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          if (!response.ok) {
            setStatus("error");
            return;
          }

          const data = (await response.json()) as {
            found?: boolean;
            reason?: string;
            cidade?: string;
            uf?: string;
          };

          if (data.found === false) {
            setStatus(data.reason === "outside_brazil" ? "outside" : "error");
            setLocationDetected(false);
            return;
          }

          if (!data.cidade || !data.uf) {
            setStatus("error");
            setLocationDetected(false);
            return;
          }

          setCidade(data.cidade);
          setUf(data.uf.toUpperCase());
          setStatus("idle");
          setLocationDetected(true);

          if (autoSubmit && formRef.current && !autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            formRef.current.requestSubmit();
          }
        } catch {
          setStatus("error");
        }
      },
      () => {
        setStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 10 * 60 * 1000,
      },
    );
  }, []);

  React.useEffect(() => {
    loadCurrentLocation(true);
  }, [loadCurrentLocation]);

  return (
    <>
      <form
        ref={formRef}
        method="GET"
        className="grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input
          name="risk_cidade"
          value={cidade}
          onChange={(event) => {
            setCidade(event.target.value);
            setLocationDetected(false);
          }}
          placeholder="Cidade"
          required
          className="md:col-span-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />
        <input
          name="risk_uf"
          value={uf}
          onChange={(event) => {
            setUf(event.target.value.toUpperCase());
            setLocationDetected(false);
          }}
          placeholder="UF (ex.: MG)"
          required
          maxLength={2}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 transition-all"
        >
          Consultar risco
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => loadCurrentLocation(true)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Usar minha localização
        </button>

        {status === "loading" && (
          <span className="text-xs text-slate-500">Obtendo localização...</span>
        )}

        {status === "idle" && locationDetected && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            📍 Localização detectada
          </span>
        )}

        {status === "error" && (
          <span className="text-xs text-amber-700">
            Não foi possível usar sua localização. Mantido padrão Juiz de
            Fora/MG.
          </span>
        )}

        {status === "outside" && (
          <span className="text-xs text-amber-700">
            Localização atual fora do Brasil. Mantido padrão Juiz de Fora/MG.
          </span>
        )}
      </div>
    </>
  );
}
