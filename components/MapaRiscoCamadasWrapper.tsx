"use client";

import dynamic from "next/dynamic";

const MapaRiscoCamadas = dynamic(() => import("./MapaRiscoCamadas"), {
  ssr: false,
  loading: () => (
    <div className="h-115 w-full rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-500">
      Carregando mapa de riscos...
    </div>
  ),
});

export default function MapaRiscoCamadasWrapper(props: {
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  riscoEnchente: "BAIXO" | "MODERADO" | "ALTO";
  riscoDeslizamento: "BAIXO" | "MODERADO" | "ALTO";
}) {
  return <MapaRiscoCamadas {...props} />;
}
