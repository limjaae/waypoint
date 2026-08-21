import { describe, expect, it } from "vitest";
import { scoreCrewsForWorkOrder } from "./scoring";
import { assets, crews, locations, workOrders } from "./seed-data";

const locationMap = new Map(locations.map((l) => [l.id, l]));

describe("scoreCrewsForWorkOrder", () => {
  it("ranks the certified crew above a closer but uncertified one", () => {
    const workOrder = workOrders[0]; // WO-1048, needs high_voltage_electrical
    const asset = assets.find((a) => a.id === workOrder.assetId)!;
    const assetLocation = locationMap.get(asset.locationId)!;

    const ranked = scoreCrewsForWorkOrder(workOrder, asset, assetLocation, crews, locationMap);

    // Crew 07 has the certification; Crew 12 is roughly similar distance but lacks it.
    expect(ranked[0].crewId).toBe("crew-07");
    expect(ranked[0].hasCertification).toBe(true);
  });

  it("excludes off-shift crews entirely", () => {
    const offShiftCrew = { ...crews[0], id: "crew-99", availability: "off_shift" as const };
    const workOrder = workOrders[0];
    const asset = assets.find((a) => a.id === workOrder.assetId)!;
    const assetLocation = locationMap.get(asset.locationId)!;

    const ranked = scoreCrewsForWorkOrder(
      workOrder,
      asset,
      assetLocation,
      [...crews, offShiftCrew],
      locationMap
    );

    expect(ranked.find((r) => r.crewId === "crew-99")).toBeUndefined();
  });

  it("penalises a busy, high-workload crew even if it is the closest", () => {
    const workOrder = workOrders[1]; // WO-1052, needs mechanical
    const asset = assets.find((a) => a.id === workOrder.assetId)!;
    const assetLocation = locationMap.get(asset.locationId)!;

    const ranked = scoreCrewsForWorkOrder(workOrder, asset, assetLocation, crews, locationMap);
    const crew04 = ranked.find((r) => r.crewId === "crew-04");

    expect(crew04?.workloadPenalty).toBeGreaterThan(20);
  });
});
