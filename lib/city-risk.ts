type RiskLevel = "BAIXO" | "MODERADO" | "ALTO";

export type CityRiskResult = {
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  chuvaMmHoje: number;
  chuvaMmAmanha: number;
  chuvaMm3Dias: number;
  riscoEnchente: RiskLevel;
  riscoDeslizamento: RiskLevel;
  fonte: string;
  resumo: string;
};

const UF_TO_STATE_NAME: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country_code?: string;
    admin1?: string;
  }>;
};

type ForecastResponse = {
  daily?: {
    precipitation_sum?: number[];
  };
};

type GeoItem = NonNullable<GeocodingResponse["results"]>[number];

function normalizeText(value: string | undefined | null): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function fetchGeocodingResults(query: string): Promise<GeoItem[]> {
  const geocodingUrl =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name: query,
      count: "10",
      language: "pt",
      format: "json",
      countryCode: "BR",
    }).toString();

  const response = await fetch(geocodingUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as GeocodingResponse;
  return data.results ?? [];
}

async function geocodeBrazilCity(cidade: string, uf: string, estado: string) {
  const queryCandidates = [
    cidade,
    `${cidade} ${uf}`,
    `${cidade} ${estado}`,
    `${cidade} Brasil`,
    `${cidade}, ${uf}`,
    `${cidade}, ${estado}`,
  ];

  const expectedState = normalizeText(estado);
  const expectedUf = normalizeText(uf);

  for (const candidate of queryCandidates) {
    const results = await fetchGeocodingResults(candidate);
    if (results.length === 0) continue;

    const brazilOnly = results.filter((item) => {
      const cc = normalizeText(item.country_code);
      return cc === "br" || cc === "bra" || cc === "";
    });

    if (brazilOnly.length === 0) continue;

    const cityMatch = brazilOnly.filter(
      (item) => normalizeText(item.name) === normalizeText(cidade),
    );

    const stateMatch = cityMatch.find((item) => {
      const adminState = normalizeText(item.admin1);
      return adminState === expectedState || adminState.includes(expectedUf);
    });

    if (stateMatch) return stateMatch;
    if (cityMatch.length > 0) return cityMatch[0];
    return brazilOnly[0];
  }

  return null;
}

function toRiskLevelByFlood(chuvaHoje: number, chuva3Dias: number): RiskLevel {
  if (chuvaHoje >= 80 || chuva3Dias >= 140) return "ALTO";
  if (chuvaHoje >= 40 || chuva3Dias >= 80) return "MODERADO";
  return "BAIXO";
}

function toRiskLevelByLandslide(chuva3Dias: number): RiskLevel {
  if (chuva3Dias >= 120) return "ALTO";
  if (chuva3Dias >= 70) return "MODERADO";
  return "BAIXO";
}

export async function getCityRisk(
  cidade: string,
  uf: string,
): Promise<CityRiskResult | null> {
  const cidadeLimpa = cidade.trim();
  const ufLimpa = uf.trim().toUpperCase();

  if (!cidadeLimpa || !ufLimpa) return null;

  const estadoNome = UF_TO_STATE_NAME[ufLimpa] || ufLimpa;
  const geoItem = await geocodeBrazilCity(cidadeLimpa, ufLimpa, estadoNome);

  if (!geoItem) return null;

  const forecastUrl =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: String(geoItem.latitude),
      longitude: String(geoItem.longitude),
      daily: "precipitation_sum",
      forecast_days: "3",
      timezone: "auto",
    }).toString();

  const forecastResponse = await fetch(forecastUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!forecastResponse.ok) return null;

  const forecastData = (await forecastResponse.json()) as ForecastResponse;
  const precipitation = forecastData.daily?.precipitation_sum ?? [0, 0, 0];

  const chuvaHoje = Number(precipitation[0] ?? 0);
  const chuvaAmanha = Number(precipitation[1] ?? 0);
  const chuva3Dias = Number(
    precipitation.reduce((acc, value) => acc + Number(value || 0), 0),
  );

  const riscoEnchente = toRiskLevelByFlood(chuvaHoje, chuva3Dias);
  const riscoDeslizamento = toRiskLevelByLandslide(chuva3Dias);

  return {
    cidade: geoItem.name,
    estado: geoItem.admin1 || estadoNome,
    latitude: geoItem.latitude,
    longitude: geoItem.longitude,
    chuvaMmHoje: Number(chuvaHoje.toFixed(1)),
    chuvaMmAmanha: Number(chuvaAmanha.toFixed(1)),
    chuvaMm3Dias: Number(chuva3Dias.toFixed(1)),
    riscoEnchente,
    riscoDeslizamento,
    fonte: "Open-Meteo Geocoding + Forecast (camada gratuita)",
    resumo:
      "Classificação estimada por chuva prevista (heurística). Em caso de alerta local, priorize Defesa Civil (199).",
  };
}
