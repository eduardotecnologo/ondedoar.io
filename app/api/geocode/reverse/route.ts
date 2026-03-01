import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const STATE_TO_UF: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

type ReverseGeocodeOutcome =
  | "success"
  | "outside_brazil"
  | "city_not_found"
  | "invalid_coordinates"
  | "reverse_geocode_failed";

let reverseGeocodeEventsTableReady = false;

function normalizeText(value: string | undefined | null): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stateToUf(
  state: string | undefined,
  stateCode?: string,
): string | null {
  const code = String(stateCode || "")
    .trim()
    .toUpperCase();
  if (code.startsWith("BR-")) return code.slice(3);
  if (code.length === 2) return code;

  const normalizedState = normalizeText(state);
  return STATE_TO_UF[normalizedState] || null;
}

async function persistReverseGeocodeEvent(params: {
  outcome: ReverseGeocodeOutcome;
  lat?: number;
  lon?: number;
}) {
  const latRounded =
    typeof params.lat === "number" && Number.isFinite(params.lat)
      ? Number(params.lat.toFixed(2))
      : null;
  const lonRounded =
    typeof params.lon === "number" && Number.isFinite(params.lon)
      ? Number(params.lon.toFixed(2))
      : null;

  try {
    if (!reverseGeocodeEventsTableReady) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS geocode_reverse_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          outcome TEXT NOT NULL,
          lat_rounded NUMERIC(6,2),
          lon_rounded NUMERIC(6,2),
          criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS geocode_reverse_events_outcome_idx
          ON geocode_reverse_events(outcome)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS geocode_reverse_events_criado_em_idx
          ON geocode_reverse_events(criado_em)
      `);

      reverseGeocodeEventsTableReady = true;
    }

    await prisma.$executeRaw`
      INSERT INTO geocode_reverse_events (outcome, lat_rounded, lon_rounded)
      VALUES (${params.outcome}, ${latRounded}, ${lonRounded})
    `;
  } catch (error) {
    console.warn("[geocode.reverse] persist_failed", error);
  }
}

function logReverseGeocodeEvent(params: {
  outcome: ReverseGeocodeOutcome;
  lat?: number;
  lon?: number;
}) {
  const latRounded =
    typeof params.lat === "number" && Number.isFinite(params.lat)
      ? Number(params.lat.toFixed(2))
      : null;
  const lonRounded =
    typeof params.lon === "number" && Number.isFinite(params.lon)
      ? Number(params.lon.toFixed(2))
      : null;

  console.info("[geocode.reverse]", {
    outcome: params.outcome,
    latRounded,
    lonRounded,
  });

  void persistReverseGeocodeEvent(params);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") || "");
  const lon = Number(searchParams.get("lon") || "");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    logReverseGeocodeEvent({
      outcome: "invalid_coordinates",
      lat,
      lon,
    });
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "jsonv2",
      addressdetails: "1",
      "accept-language": "pt-BR",
    }).toString();

  const response = await fetch(url, {
    headers: {
      "User-Agent": "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    logReverseGeocodeEvent({
      outcome: "reverse_geocode_failed",
      lat,
      lon,
    });
    return NextResponse.json(
      { error: "reverse_geocode_failed" },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
      state?: string;
      state_code?: string;
      country_code?: string;
    };
  };

  const address = data.address;
  const cidade =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    address?.county ||
    null;

  const uf = stateToUf(address?.state, address?.state_code);
  const countryCode = String(address?.country_code || "").toLowerCase();

  if (countryCode && countryCode !== "br") {
    logReverseGeocodeEvent({
      outcome: "outside_brazil",
      lat,
      lon,
    });
    return NextResponse.json({
      found: false,
      reason: "outside_brazil",
      cidade: null,
      uf: null,
    });
  }

  if (!cidade || !uf) {
    logReverseGeocodeEvent({
      outcome: "city_not_found",
      lat,
      lon,
    });
    return NextResponse.json({
      found: false,
      reason: "city_not_found",
      cidade: null,
      uf: null,
    });
  }

  logReverseGeocodeEvent({
    outcome: "success",
    lat,
    lon,
  });

  return NextResponse.json({
    found: true,
    cidade,
    uf,
  });
}
