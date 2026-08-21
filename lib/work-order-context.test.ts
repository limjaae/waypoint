import { beforeEach, describe, expect, it } from "vitest";
import { buildWorkOrderContext } from "./work-order-context";
import { __resetStoreForTests } from "./store";

describe("buildWorkOrderContext", () => {
  beforeEach(() => {
    __resetStoreForTests();
  });

  it("returns null for an unknown work order", () => {
    expect(buildWorkOrderContext("wo-does-not-exist")).toBeNull();
  });

  it("pulls asset, location, maintenance history and nearby crews for a known work order", () => {
    const context = buildWorkOrderContext("wo-1048");
    expect(context).not.toBeNull();
    expect(context!.asset.id).toBe("asset-1");
    expect(context!.location.id).toBe("loc-1");
    expect(context!.maintenanceHistory.every((m) => m.assetId === "asset-1")).toBe(true);
    // Most recent maintenance record should come first.
    expect(context!.maintenanceHistory[0].date >= context!.maintenanceHistory[1].date).toBe(true);
    expect(context!.nearbyCrews.length).toBeGreaterThan(0);
    expect(context!.nearbyCrews[0].distanceKm).toBeLessThanOrEqual(context!.nearbyCrews.at(-1)!.distanceKm);
  });

  it("surfaces related work orders that share a location", () => {
    // wo-1048 (asset-1) and wo-1060 (asset-3) are both at loc-1.
    const context = buildWorkOrderContext("wo-1048");
    const related = context!.relatedWorkOrders.find((r) => r.workOrder.id === "wo-1060");
    expect(related).toBeDefined();
    expect(related!.relationship).toBe("same_location");
  });

  it("does not include the work order itself in its own related list", () => {
    const context = buildWorkOrderContext("wo-1048");
    expect(context!.relatedWorkOrders.some((r) => r.workOrder.id === "wo-1048")).toBe(false);
  });
});
