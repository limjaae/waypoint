import { Assignment, AssignmentStatus, BlockedReason, Decision, ScoreBreakdown, WorkOrderStatus } from "./types";
import { workOrders as seedWorkOrders } from "./seed-data";

// In-memory runtime store for everything that changes during a session:
// work order status, assignments, and the decision log.
//
// Tradeoff, documented rather than hidden: db/schema.sql is the real backing
// store this is meant to become once a live Supabase project is connected.
// Module-scope state is the smallest defensible stand-in for that: it behaves
// correctly for a single running server process, which is all a demo needs,
// but it will NOT persist across a serverless cold start in production and
// resets on every dev server restart. Swapping this file's functions for
// Supabase queries against the existing schema is the entire migration path.

let workOrderStatusOverrides = new Map<string, WorkOrderStatus>();
let assignments: Assignment[] = [];
let decisions: Decision[] = [];
let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

export function getWorkOrderStatus(workOrderId: string): WorkOrderStatus {
  const override = workOrderStatusOverrides.get(workOrderId);
  if (override) return override;
  const seeded = seedWorkOrders.find((wo) => wo.id === workOrderId);
  return seeded?.status ?? "open";
}

export function getOpenWorkOrderIds(): Set<string> {
  return new Set(
    seedWorkOrders
      .map((wo) => wo.id)
      .filter((id) => getWorkOrderStatus(id) === "open")
  );
}

export function getAssignmentForWorkOrder(workOrderId: string): Assignment | undefined {
  // Most recent assignment wins, a reassignment after a blockage creates a
  // new record rather than mutating history, so the decision log stays intact.
  const forOrder = assignments.filter((a) => a.workOrderId === workOrderId);
  return forOrder[forOrder.length - 1];
}

export function getAssignmentHistoryForWorkOrder(workOrderId: string): Assignment[] {
  return assignments.filter((a) => a.workOrderId === workOrderId);
}

export function createAssignment(workOrderId: string, crewId: string): Assignment {
  const assignment: Assignment = {
    id: nextId("assign"),
    workOrderId,
    crewId,
    status: "assigned",
    assignedAt: new Date().toISOString(),
  };
  assignments = [...assignments, assignment];
  workOrderStatusOverrides.set(workOrderId, "assigned");
  return assignment;
}

export function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  blockedReason?: BlockedReason
): Assignment | undefined {
  let updated: Assignment | undefined;
  assignments = assignments.map((a) => {
    if (a.id !== assignmentId) return a;
    updated = { ...a, status, blockedReason: status === "blocked" ? blockedReason : undefined };
    return updated;
  });
  if (updated) {
    const workOrderStatus: WorkOrderStatus =
      status === "in_progress" ? "in_progress" : status === "blocked" ? "blocked" : status === "complete" ? "complete" : "assigned";
    workOrderStatusOverrides.set(updated.workOrderId, workOrderStatus);
  }
  return updated;
}

export function reassignCrew(workOrderId: string, newCrewId: string): Assignment {
  // A replan after a blockage is logged as a fresh assignment rather than an
  // edit, so the decision log keeps a full trail of "who was assigned, when,
  // and why it changed" instead of overwriting the record of what happened.
  const assignment: Assignment = {
    id: nextId("assign"),
    workOrderId,
    crewId: newCrewId,
    status: "assigned",
    assignedAt: new Date().toISOString(),
  };
  assignments = [...assignments, assignment];
  workOrderStatusOverrides.set(workOrderId, "assigned");
  return assignment;
}

export function logDecision(entry: {
  workOrderId: string;
  crewId: string;
  decisionMaker: string;
  reasoning: string;
  scoreBreakdown?: ScoreBreakdown;
}): Decision {
  const decision: Decision = {
    id: nextId("decision"),
    workOrderId: entry.workOrderId,
    crewId: entry.crewId,
    decisionMaker: entry.decisionMaker,
    reasoning: entry.reasoning,
    scoreBreakdown: entry.scoreBreakdown,
    createdAt: new Date().toISOString(),
  };
  decisions = [...decisions, decision];
  return decision;
}

export function getDecisions(): Decision[] {
  return [...decisions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getDecisionsForWorkOrder(workOrderId: string): Decision[] {
  return getDecisions().filter((d) => d.workOrderId === workOrderId);
}

/** Test-only escape hatch so each test file starts from a clean slate. */
export function __resetStoreForTests(): void {
  workOrderStatusOverrides = new Map();
  assignments = [];
  decisions = [];
  idCounter = 0;
}
