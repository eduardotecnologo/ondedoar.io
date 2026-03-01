"use client";

import React from "react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type RiskLevel = "BAIXO" | "MODERADO" | "ALTO";
type RiskBand = "R1" | "R2" | "R3" | "R4";

type Zone = {
  band: RiskBand;
  positions: [number, number][];
  color: string;
};

function normalizeBand(level: RiskLevel): RiskBand {
  if (level === "ALTO") return "R3";
  if (level === "MODERADO") return "R2";
  return "R1";
}

function bandWeight(band: RiskBand, current: RiskBand): number {
  return band === current ? 3 : 1;
}

function bandOpacity(band: RiskBand, current: RiskBand): number {
  return band === current ? 0.38 : 0.2;
}

function createRect(
  centerLat: number,
  centerLon: number,
  latOffset: number,
  lonOffset: number,
): [number, number][] {
  return [
    [centerLat - latOffset, centerLon - lonOffset],
    [centerLat - latOffset, centerLon + lonOffset],
    [centerLat + latOffset, centerLon + lonOffset],
    [centerLat + latOffset, centerLon - lonOffset],
  ];
}

function buildHydroZones(lat: number, lon: number): Zone[] {
  return [
    {
      band: "R1",
      color: "#38bdf8",
      positions: createRect(lat + 0.0035, lon - 0.0045, 0.0014, 0.0021),
    },
    {
      band: "R2",
      color: "#0ea5e9",
      positions: createRect(lat + 0.001, lon - 0.0005, 0.0015, 0.0025),
    },
    {
      band: "R3",
      color: "#0284c7",
      positions: createRect(lat - 0.0016, lon + 0.0032, 0.0016, 0.0023),
    },
    {
      band: "R4",
      color: "#1d4ed8",
      positions: createRect(lat - 0.0039, lon + 0.0062, 0.0012, 0.0019),
    },
  ];
}

function buildGeoZones(lat: number, lon: number): Zone[] {
  return [
    {
      band: "R1",
      color: "#16a34a",
      positions: createRect(lat - 0.004, lon - 0.0048, 0.0012, 0.0022),
    },
    {
      band: "R2",
      color: "#eab308",
      positions: createRect(lat - 0.0056, lon - 0.0015, 0.0012, 0.0024),
    },
    {
      band: "R3",
      color: "#f97316",
      positions: createRect(lat - 0.0065, lon + 0.0022, 0.0013, 0.0023),
    },
    {
      band: "R4",
      color: "#db2777",
      positions: createRect(lat - 0.007, lon + 0.0062, 0.0012, 0.002),
    },
  ];
}

function FitToCenter({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  React.useEffect(() => {
    map.setView([latitude, longitude], 14);
  }, [map, latitude, longitude]);

  return null;
}

function ZonesLayer({
  title,
  zones,
  currentBand,
}: {
  title: string;
  zones: Zone[];
  currentBand: RiskBand;
}) {
  return (
    <LayerGroup>
      {zones.map((zone) => (
        <Polygon
          key={`${title}-${zone.band}`}
          positions={zone.positions}
          pathOptions={{
            color: zone.color,
            weight: bandWeight(zone.band, currentBand),
            fillColor: zone.color,
            fillOpacity: bandOpacity(zone.band, currentBand),
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm min-w-45">
              <p className="font-bold text-slate-800">{title}</p>
              <p>
                Nível: <strong>{zone.band}</strong>
              </p>
              <p>
                Status: {zone.band === currentBand ? "destacado" : "camada"}
              </p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </LayerGroup>
  );
}

export default function MapaRiscoCamadas({
  cidade,
  estado,
  latitude,
  longitude,
  riscoEnchente,
  riscoDeslizamento,
}: {
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  riscoEnchente: RiskLevel;
  riscoDeslizamento: RiskLevel;
}) {
  const hydroCurrentBand = normalizeBand(riscoEnchente);
  const geoCurrentBand = normalizeBand(riscoDeslizamento);

  const hydroZones = React.useMemo(
    () => buildHydroZones(latitude, longitude),
    [latitude, longitude],
  );
  const geoZones = React.useMemo(
    () => buildGeoZones(latitude, longitude),
    [latitude, longitude],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        Camadas visuais R1–R4 para <strong>{cidade}</strong> - {estado}. O nível
        atual está com destaque de borda.
      </div>

      <div
        className="w-full rounded-2xl overflow-hidden border border-slate-200"
        style={{ height: 460 }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitToCenter latitude={latitude} longitude={longitude} />

          <LayersControl position="topright">
            <LayersControl.Overlay checked name="Risco Hidrológico">
              <ZonesLayer
                title="Risco Hidrológico"
                zones={hydroZones}
                currentBand={hydroCurrentBand}
              />
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Risco Geológico">
              <ZonesLayer
                title="Risco Geológico"
                zones={geoZones}
                currentBand={geoCurrentBand}
              />
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </div>
    </div>
  );
}
