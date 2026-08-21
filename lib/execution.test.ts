import { describe, expect, it } from "vitest";
import { blockedReasonLabel, getRecalculatedCandidates } from "./execution";

describe("getRecalculatedCandidates", () => {
  it("excludes the crew that reported the blockage from the new recommendation", () => {
    const candidates = getRecalculatedCandidates("wo-1048", "crew-07");
    expect(candidates.some((c) => c.crewId === "crew-07")).toBe(false);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("returns an empty list for an unknown work order", () => {
    expect(getRecalculatedCandidates("wo-nope", "crew-07")).toEqual([]);
  });
});

describe("blockedReasonLabel", () => {
  it("maps known reasons to a readable label", () => {
    expect(blockedReasonLabel("missing_equipment")).toBe("Missing equipment");
    expect(blockedReasonLabel("needs_specialist")).toBe("Needs a specialist");
  });

  it("falls back to Unspecified for an unset reason", () => {
    expect(blockedReasonLabel(undefined)).toBe("Unspecified");
  });
});
