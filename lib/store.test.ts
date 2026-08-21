import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetStoreForTests,
  createAssignment,
  getAssignmentForWorkOrder,
  getAssignmentHistoryForWorkOrder,
  getDecisions,
  getWorkOrderStatus,
  logDecision,
  reassignCrew,
  updateAssignmentStatus,
} from "./store";

describe("store", () => {
  beforeEach(() => {
    __resetStoreForTests();
  });

  it("starts a work order as open until an assignment is made", () => {
    expect(getWorkOrderStatus("wo-1048")).toBe("open");
    createAssignment("wo-1048", "crew-07");
    expect(getWorkOrderStatus("wo-1048")).toBe("assigned");
  });

  it("moves the work order status when the assignment status changes", () => {
    const assignment = createAssignment("wo-1048", "crew-07");
    updateAssignmentStatus(assignment.id, "in_progress");
    expect(getWorkOrderStatus("wo-1048")).toBe("in_progress");

    updateAssignmentStatus(assignment.id, "blocked", "weather");
    expect(getWorkOrderStatus("wo-1048")).toBe("blocked");
    expect(getAssignmentForWorkOrder("wo-1048")?.blockedReason).toBe("weather");
  });

  it("keeps a full history of assignments across a reassignment rather than overwriting it", () => {
    createAssignment("wo-1048", "crew-07");
    reassignCrew("wo-1048", "crew-12");

    const history = getAssignmentHistoryForWorkOrder("wo-1048");
    expect(history).toHaveLength(2);
    expect(getAssignmentForWorkOrder("wo-1048")?.crewId).toBe("crew-12");
    expect(getWorkOrderStatus("wo-1048")).toBe("assigned");
  });

  it("logs decisions in reverse-chronological order", async () => {
    logDecision({ workOrderId: "wo-1048", crewId: "crew-07", decisionMaker: "Priya Nair", reasoning: "first" });
    await new Promise((resolve) => setTimeout(resolve, 2));
    logDecision({ workOrderId: "wo-1048", crewId: "crew-12", decisionMaker: "Priya Nair", reasoning: "second" });

    const decisions = getDecisions();
    expect(decisions).toHaveLength(2);
    expect(decisions[0].reasoning).toBe("second");
  });
});
