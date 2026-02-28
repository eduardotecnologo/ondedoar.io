"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type UseMyLocationButtonProps = {
  variant?: "default" | "compact";
};

export default function UseMyLocationButton({
  variant = "default",
}: UseMyLocationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUseLocation = () => {
    setErrorMessage(null);

    if (!("geolocation" in navigator)) {
      setErrorMessage("Geolocalização não disponível neste dispositivo.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("geoLat", position.coords.latitude.toFixed(6));
        params.set("geoLon", position.coords.longitude.toFixed(6));
        params.delete("cidade");

        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      },
      () => {
        setLoading(false);
        setErrorMessage("Não foi possível acessar sua localização.");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      },
    );
  };

  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "flex flex-col items-start gap-1"
          : "mt-3 flex flex-col items-center gap-2"
      }
    >
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={loading}
        className={
          isCompact
            ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 whitespace-nowrap"
            : "bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        }
      >
        {loading ? "Detectando..." : "📍 Minha localização"}
      </button>
      {errorMessage ? (
        <span
          className={
            isCompact ? "text-[11px] text-red-600" : "text-xs text-blue-100"
          }
        >
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
