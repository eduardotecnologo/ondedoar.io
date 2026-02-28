"use client";

import dynamic from "next/dynamic";
import type { Interdicao } from "@/types/interdicao";

const MapaInterdicoes = dynamic(() => import("./MapaInterdicoes"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-3xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
      Carregando mapa de interdições...
    </div>
  ),
});

export default function MapaInterdicoesWrapper({
  interdicoes,
}: {
  interdicoes: Interdicao[];
}) {
  return <MapaInterdicoes interdicoes={interdicoes} />;
}
