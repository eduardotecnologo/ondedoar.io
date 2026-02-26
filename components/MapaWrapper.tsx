"use client";

import dynamic from "next/dynamic";
import type { Ponto } from "@/types/ponto";

const MapaHome = dynamic(() => import("./MapaHome"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-200 animate-pulse rounded-3xl flex items-center justify-center text-slate-400">
      Carregando mapa...
    </div>
  ),
});

export default function MapaWrapper({ pontos }: { pontos: Ponto[] }) {
  return <MapaHome pontos={pontos} />;
}
