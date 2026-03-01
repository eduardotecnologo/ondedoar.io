"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import React from "react";
import "leaflet/dist/leaflet.css";
import type { Interdicao } from "@/types/interdicao";

const iconRetinaUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const iconUrl =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
const shadowUrl =
  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const iconInterdicao = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type InterdicaoComCoordenada = Interdicao & {
  latitude: number;
  longitude: number;
};

type OverpassElement = {
  id: number;
  tags?: {
    name?: string;
  };
  geometry?: Array<{
    lat: number;
    lon: number;
  }>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OVERPASS_COOLDOWN_MS = 5 * 60 * 1000;
const OVERPASS_MAX_LOOKUPS_PER_RENDER = 8;

let overpassBlockedUntil = 0;
const ruaGeometriaCache = new Map<string, [number, number][] | null>();

function buildRuaSinalizacao(
  latitude: number,
  longitude: number,
): [number, number][] {
  const latOffset = 0.00035;
  const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
  const lonOffset = 0.001 / cosLat;

  return [
    [latitude - latOffset, longitude - lonOffset],
    [latitude + latOffset, longitude + lonOffset],
  ];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchRuaGeometria(
  item: InterdicaoComCoordenada,
): Promise<[number, number][] | null> {
  const ruaEscaped = escapeRegex(item.rua.trim());
  if (!ruaEscaped) return null;

  const cacheKey = `${ruaEscaped}|${item.latitude.toFixed(5)}|${item.longitude.toFixed(5)}`;
  if (ruaGeometriaCache.has(cacheKey)) {
    return ruaGeometriaCache.get(cacheKey) ?? null;
  }

  if (Date.now() < overpassBlockedUntil) {
    ruaGeometriaCache.set(cacheKey, null);
    return null;
  }

  const query = `[out:json][timeout:20];way(around:120,${item.latitude},${item.longitude})["highway"]["name"~"^${ruaEscaped}$",i];out geom;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (response.status === 429) {
      overpassBlockedUntil = Date.now() + OVERPASS_COOLDOWN_MS;
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as OverpassResponse;
    const ways = (data.elements ?? []).filter(
      (element) =>
        Array.isArray(element.geometry) && element.geometry.length > 1,
    );

    if (ways.length === 0) {
      continue;
    }

    const bestWay = ways
      .map((way) => {
        const distance = Math.min(
          ...(way.geometry ?? []).map((point) =>
            Math.hypot(point.lat - item.latitude, point.lon - item.longitude),
          ),
        );

        return {
          way,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance)[0]?.way;

    if (!bestWay?.geometry || bestWay.geometry.length < 2) {
      continue;
    }

    const geometry = bestWay.geometry.map((point) => [
      point.lat,
      point.lon,
    ]) as [number, number][];

    ruaGeometriaCache.set(cacheKey, geometry);
    return geometry;
  }

  ruaGeometriaCache.set(cacheKey, null);
  return null;
}

function FitToInterdicoes({
  interdicoes,
}: {
  interdicoes: InterdicaoComCoordenada[];
}) {
  const map = useMap();

  React.useEffect(() => {
    if (interdicoes.length === 0) {
      map.setView([-15.7801, -47.9292], 4);
      return;
    }

    if (interdicoes.length === 1) {
      map.setView([interdicoes[0].latitude, interdicoes[0].longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(
      interdicoes.map(
        (item) => [item.latitude, item.longitude] as [number, number],
      ),
    );

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, interdicoes]);

  return null;
}

export default function MapaInterdicoes({
  interdicoes,
}: {
  interdicoes: Interdicao[];
}) {
  const validas = React.useMemo(
    () =>
      interdicoes.filter(
        (item): item is InterdicaoComCoordenada =>
          typeof item.latitude === "number" &&
          typeof item.longitude === "number" &&
          item.latitude !== 0 &&
          item.longitude !== 0,
      ),
    [interdicoes],
  );

  const [ruasGeometria, setRuasGeometria] = React.useState<
    Record<string, [number, number][]>
  >({});

  React.useEffect(() => {
    let active = true;

    async function loadGeometrias() {
      const pairs: Array<readonly [string, [number, number][] | null]> = [];
      const targets = validas.slice(0, OVERPASS_MAX_LOOKUPS_PER_RENDER);

      for (const item of targets) {
        if (!active) break;

        try {
          const geometry = await fetchRuaGeometria(item);
          pairs.push([item.id, geometry] as const);
        } catch {
          pairs.push([item.id, null] as const);
        }
      }

      if (!active) return;

      const nextState: Record<string, [number, number][]> = {};
      for (const [id, geometry] of pairs) {
        if (geometry && geometry.length > 1) {
          nextState[id] = geometry;
        }
      }

      setRuasGeometria(nextState);
    }

    if (validas.length > 0) {
      loadGeometrias();
    } else {
      setRuasGeometria({});
    }

    return () => {
      active = false;
    };
  }, [validas]);

  return (
    <div className="h-[420px] w-full rounded-3xl overflow-hidden border-4 border-white shadow-inner">
      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToInterdicoes interdicoes={validas} />

        {validas.map((item) => (
          <React.Fragment key={item.id}>
            <Polyline
              positions={
                ruasGeometria[item.id] ??
                buildRuaSinalizacao(item.latitude, item.longitude)
              }
              pathOptions={{
                color: "#dc2626",
                weight: 6,
                opacity: 0.95,
                lineCap: "round",
              }}
            />
            <Marker
              position={[item.latitude, item.longitude]}
              icon={iconInterdicao}
            >
              <Popup>
                <div className="space-y-2 text-sm min-w-[220px]">
                  <p className="flex items-center gap-1 font-bold text-red-600">
                    <span aria-hidden>🚧</span>
                    Rua interditada
                  </p>
                  <p className="font-semibold text-red-700">
                    {item.rua}
                    {item.numero ? `, ${item.numero}` : ""}
                  </p>
                  <p>
                    {item.cidade} - {item.estado}
                  </p>
                  {item.motivo && (
                    <p>
                      <strong>Motivo:</strong> {item.motivo}
                    </p>
                  )}
                  {item.referencia && (
                    <p>
                      <strong>Referência:</strong> {item.referencia}
                    </p>
                  )}
                  {item.fotoMotivo ? (
                    <img
                      src={item.fotoMotivo}
                      alt={`Foto da interdição em ${item.rua}`}
                      className="mt-1 h-28 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">
                      Foto não disponível.
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
