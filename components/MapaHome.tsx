"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ponto } from "@/types/ponto"; // <- NOTE o caminho absoluto pode ser usado se você tiver baseUrl/paths; caso contrário use '../../types/ponto'

const iconRetinaUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const shadowUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const iconInactive = L.icon({
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = iconDefault;

type Props = {
  pontos: Ponto[];
};

type PontoComCoordenadas = Ponto & { latitude: number; longitude: number };

function FitToPontos({ pontos }: { pontos: PontoComCoordenadas[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (pontos.length === 0) {
      map.setView([-15.7801, -47.9292], 4);
      return;
    }

    if (pontos.length === 1) {
      map.setView([pontos[0].latitude, pontos[0].longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(
      pontos.map(
        (ponto) => [ponto.latitude, ponto.longitude] as [number, number],
      ),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, pontos]);

  return null;
}

function FocusPontoController({
  pontos,
  markerRefs,
}: {
  pontos: PontoComCoordenadas[];
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  React.useEffect(() => {
    const handleFocusPonto = (event: Event) => {
      const customEvent = event as CustomEvent<{ pontoId?: string }>;
      const pontoId = customEvent.detail?.pontoId;

      if (!pontoId) return;

      const pontoAlvo = pontos.find((ponto) => ponto.id === pontoId);
      if (!pontoAlvo) return;

      map.flyTo([pontoAlvo.latitude, pontoAlvo.longitude], 16, {
        duration: 1.2,
      });

      const marker = markerRefs.current[pontoId];
      if (marker) {
        window.setTimeout(() => {
          marker.openPopup();
        }, 400);
      }
    };

    window.addEventListener(
      "ondedoar:focus-ponto",
      handleFocusPonto as EventListener,
    );

    return () => {
      window.removeEventListener(
        "ondedoar:focus-ponto",
        handleFocusPonto as EventListener,
      );
    };
  }, [map, markerRefs, pontos]);

  return null;
}

export default function MapaHome({ pontos }: Props) {
  const markerRefs = React.useRef<Record<string, L.Marker | null>>({});

  const pontosValidos = pontos.filter(
    (p): p is PontoComCoordenadas =>
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      p.latitude !== 0 &&
      p.longitude !== 0,
  );

  const center: [number, number] =
    pontosValidos.length > 0
      ? [pontosValidos[0].latitude, pontosValidos[0].longitude]
      : [-15.7801, -47.9292];

  const zoom = pontosValidos.length > 0 ? 12 : 4;

  const buildWhatsAppUrl = (
    phone: string | null | undefined,
  ): string | null => {
    if (!phone) return null;
    const sanitizedPhone = phone.replace(/\D/g, "");
    if (!sanitizedPhone) return null;
    return `https://wa.me/${sanitizedPhone}`;
  };

  return (
    <div className="h-100 w-full rounded-3xl overflow-hidden shadow-inner border-4 border-white">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPontos pontos={pontosValidos} />
        <FocusPontoController pontos={pontosValidos} markerRefs={markerRefs} />
        {pontosValidos.map((ponto) => {
          const whatsappUrl = buildWhatsAppUrl(
            ponto.whatsapp ?? ponto.telefone,
          );
          const markerIcon =
            ponto.statusDoacao === "INATIVO" ? iconInactive : iconDefault;

          return (
            <Marker
              key={ponto.id}
              position={[ponto.latitude, ponto.longitude]}
              icon={markerIcon}
              ref={(marker) => {
                markerRefs.current[ponto.id] = marker;
              }}
            >
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-blue-600">{ponto.nome}</h3>
                  <p className="text-xs text-slate-600">
                    {ponto.endereco}
                    {ponto.numero ? `, ${ponto.numero}` : ""}
                  </p>
                  {whatsappUrl && (
                    <p className="text-xs mt-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 underline"
                      >
                        Abrir WhatsApp
                      </a>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
