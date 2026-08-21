import { Location, WeatherResult, WeatherSeverity } from "./types";

// Live weather from Open-Meteo, free, keyless, no billing, matching Meridian's
// approach. This is deliberately the one live data layer in an otherwise synthetic build.

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT_MS = 6000;

// Thresholds for flagging a weather event as worth an operator's attention.
// Picked to roughly match Bureau of Meteorology "strong wind" / "moderate rain"
// warnings rather than any Open-Meteo-specific convention.
const WATCH_WIND_KMH = 40;
const SEVERE_WIND_KMH = 65;
const WATCH_PRECIP_MM = 4;
const SEVERE_PRECIP_MM = 15;

// WMO weather codes (used by Open-Meteo) mapped to short human-readable labels.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function classifySeverity(windSpeedKmh: number, precipitationMm: number): WeatherSeverity {
  if (windSpeedKmh >= SEVERE_WIND_KMH || precipitationMm >= SEVERE_PRECIP_MM) return "severe";
  if (windSpeedKmh >= WATCH_WIND_KMH || precipitationMm >= WATCH_PRECIP_MM) return "watch";
  return "normal";
}

/**
 * Fetches current conditions for a location from Open-Meteo. Never throws,
 * network failure (including in sandboxed build/CI environments with no
 * outbound access) degrades to an "unavailable" result rather than breaking
 * the page, since a work order's context should still render without weather.
 */
export async function fetchWeatherForLocation(location: Location): Promise<WeatherResult> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", "temperature_2m,wind_speed_10m,precipitation,weather_code");
  url.searchParams.set("timezone", "auto");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "unavailable", reason: `Open-Meteo returned ${response.status}` };
    }

    const body = await response.json();
    const current = body?.current;
    if (
      !current ||
      typeof current.temperature_2m !== "number" ||
      typeof current.wind_speed_10m !== "number" ||
      typeof current.precipitation !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      return { status: "unavailable", reason: "Unexpected response shape from Open-Meteo" };
    }

    const windSpeedKmh = current.wind_speed_10m;
    const precipitationMm = current.precipitation;

    return {
      status: "ok",
      data: {
        locationId: location.id,
        temperatureC: current.temperature_2m,
        windSpeedKmh,
        precipitationMm,
        weatherCode: current.weather_code,
        conditionLabel: WEATHER_CODE_LABELS[current.weather_code] ?? "Unknown conditions",
        severity: classifySeverity(windSpeedKmh, precipitationMm),
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error fetching weather";
    return { status: "unavailable", reason };
  } finally {
    clearTimeout(timeout);
  }
}
