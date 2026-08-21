import { describe, expect, it } from "vitest";
import { describeCandidate, getRankingForWorkOrder } from "./planning";

describe("getRankingForWorkOrder", () => {
  it("returns null for an unknown work order", () => {
    expect(getRankingForWorkOrder("wo-nope")).toBeNull();
  });

  it("ranks the certified crew top for WO-1048", () => {
    const result = getRankingForWorkOrder("wo-1048");
    expect(result).not.toBeNull();
    expect(result!.ranked[0].crewId).toBe("crew-07");
    expect(result!.ranked.length).toBeGreaterThanOrEqual(2);
  });
});

describe("describeCandidate", () => {
  it("mentions the certification when the crew has it", () => {
    const result = getRankingForWorkOrder("wo-1048")!;
    const text = describeCandidate(result.ranked[0], result.workOrder.requiredCapability);
    expect(text).toContain("has the required");
    expect(text).toContain("km away");
  });

  it("flags a missing certification and the need for specialist backup", () => {
    const result = getRankingForWorkOrder("wo-1048")!;
    const uncertified = result.ranked.find((r) => !r.hasCertification)!;
    const text = describeCandidate(uncertified, result.workOrder.requiredCapability);
    expect(text).toContain("lacks the required");
    expect(text).toContain("specialist backup");
  });
});
