import { WeatherResult } from "@/lib/types";

const SEVERITY_STYLE: Record<string, { label: string; text: string; bg: string }> = {
  normal: { label: "Normal", text: "text-status-good", bg: "bg-surface-raised" },
  watch: { label: "Watch", text: "text-status-high", bg: "bg-status-high-dim" },
  severe: { label: "Severe", text: "text-status-critical", bg: "bg-status-critical-dim" },
};

export function WeatherPanel({ weather }: { weather: WeatherResult }) {
  if (weather.status === "unavailable") {
    return (
      <div className="rounded-md border border-border bg-surface p-4">
        <p className="text-sm font-medium text-text-muted">Live weather unavailable</p>
        <p className="mt-1 text-xs text-text-faint">
          Couldn&apos;t reach Open-Meteo right now ({weather.reason}). This panel refreshes on every visit,
          no cached fallback is shown so the number on screen never claims to be current when it isn&apos;t.
        </p>
      </div>
    );
  }

  const style = SEVERITY_STYLE[weather.data.severity];

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-text-muted">Live weather at this location</p>
        <span className={`rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style.text} ${style.bg}`}>
          {style.label}
        </span>
      </div>
      <p className="text-lg font-semibold text-text-primary">
        {weather.data.temperatureC}°C · {weather.data.conditionLabel}
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Wind {weather.data.windSpeedKmh}km/h · Precipitation {weather.data.precipitationMm}mm
      </p>
      <p className="mt-2 text-xs text-text-faint">Source: Open-Meteo, live, fetched just now.</p>
    </div>
  );
}
