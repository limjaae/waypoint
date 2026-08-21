import { afterEach, describe, expect, it, vi } from "vitest";
import { classifySeverity, fetchWeatherForLocation } from "./weather";
import { locations } from "./seed-data";

describe("classifySeverity", () => {
  it("is normal for calm, dry conditions", () => {
    expect(classifySeverity(10, 0)).toBe("normal");
  });

  it("is a watch once wind or rain crosses the lower threshold", () => {
    expect(classifySeverity(45, 0)).toBe("watch");
    expect(classifySeverity(0, 5)).toBe("watch");
  });

  it("is severe once wind or rain crosses the upper threshold", () => {
    expect(classifySeverity(70, 0)).toBe("severe");
    expect(classifySeverity(0, 20)).toBe("severe");
  });
});

describe("fetchWeatherForLocation", () => {
  const location = locations[0];

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a successful Open-Meteo response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 22.4,
            wind_speed_10m: 15,
            precipitation: 0,
            weather_code: 1,
          },
        }),
      })
    );

    const result = await fetchWeatherForLocation(location);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.data.temperatureC).toBe(22.4);
      expect(result.data.conditionLabel).toBe("Mainly clear");
      expect(result.data.severity).toBe("normal");
    }
  });

  it("degrades to unavailable rather than throwing when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable"))
    );

    const result = await fetchWeatherForLocation(location);
    expect(result.status).toBe("unavailable");
  });

  it("degrades to unavailable on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    );

    const result = await fetchWeatherForLocation(location);
    expect(result.status).toBe("unavailable");
  });
});
