import { Assignment, AssignmentStatus, BlockedReason, Decision, ScoreBreakdown, WorkOrderStatus } from "./types";
import { workOrders as seedWorkOrders } from "./seed-data";
import { supabase } from "./supabase";

// Runtime store for everything that changes during a session: work order
// status, assignments, and the decision log. Reference data (locations,
// assets, crews, work orders) stays static in seed-data.ts, it never changes
// after a request starts, so it doesn't need a backing table.
//
// Two implementations live in this file. When NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set, every function below reads and
// writes real rows in Supabase (see db/schema.sql), so state survives a
// serverless cold start on Vercel. Without those env vars, everything falls
// back to a plain in-memory array. That fallback is what keeps `npx vitest
// run` deterministic and network-free, and it's also what a plain `npm run
// dev` uses if a project hasn't been connected yet.

let workOrderStatusOverrides = new Map<string, WorkOrderStatus>();
let assignments: Assignment[] = [];
let decisions: Decision[] = [];
let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

interface AssignmentRow {
  id: string;
  work_order_id: string;
  crew_id: string;
  status: AssignmentStatus;
  blocked_reason: BlockedReason | null;
  assigned_at: string;
  estimated_completion: string | null;
}

function fromAssignmentRow(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    crewId: row.crew_id,
    status: row.status,
    blockedReason: row.blocked_reason ?? undefined,
    assignedAt: row.assigned_at,
    estimatedCompletion: row.estimated_completion ?? undefined,
  };
}

interface DecisionRow {
  id: string;
  work_order_id: string;
  crew_id: string;
  decision_maker: string;
  reasoning: string;
  score_breakdown: ScoreBreakdown | null;
  created_at: string;
}

function fromDecisionRow(row: DecisionRow): Decision {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    crewId: row.crew_id,
    decisionMaker: row.decision_maker,
    reasoning: row.reasoning,
    scoreBreakdown: row.score_breakdown ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getWorkOrderStatus(workOrderId: string): Promise<WorkOrderStatus> {
  if (supabase) {
    const { data } = await supabase
      .from("work_order_status_overrides")
      .select("status")
      .eq("work_order_id", workOrderId)
      .maybeSingle();
    if (data) return data.status as WorkOrderStatus;
  } else {
    const override = workOrderStatusOverrides.get(workOrderId);
    if (override) return override;
  }
  const seeded = seedWorkOrders.find((wo) => wo.id === workOrderId);
  return seeded?.status ?? "open";
}

export async function getOpenWorkOrderIds(): Promise<Set<string>> {
  const statuses = await Promise.all(seedWorkOrders.map((wo) => getWorkOrderStatus(wo.id)));
  return new Set(seedWorkOrders.filter((_, index) => statuses[index] === "open").map((wo) => wo.id));
}

export async function getAssignmentForWorkOrder(workOrderId: string): Promise<Assignment | undefined> {
  // Most recent assignment wins, a reassignment after a blockage creates a
  // new record rather than mutating history, so the decision log stays intact.
  if (supabase) {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? fromAssignmentRow(data as AssignmentRow) : undefined;
  }
  const forOrder = assignments.filter((a) => a.workOrderId === workOrderId);
  return forOrder[forOrder.length - 1];
}

export async function getAssignmentHistoryForWorkOrder(workOrderId: string): Promise<Assignment[]> {
  if (supabase) {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("seq", { ascending: true });
    return (data ?? []).map((row) => fromAssignmentRow(row as AssignmentRow));
  }
  return assignments.filter((a) => a.workOrderId === workOrderId);
}

export async function createAssignment(workOrderId: string, crewId: string): Promise<Assignment> {
  if (supabase) {
    const { data, error } = await supabase
      .from("assignments")
      .insert({ work_order_id: workOrderId, crew_id: crewId, status: "assigned" })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create assignment.");
    await setWorkOrderStatus(workOrderId, "assigned");
    return fromAssignmentRow(data as AssignmentRow);
  }
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

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  blockedReason?: BlockedReason
): Promise<Assignment | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from("assignments")
      .update({ status, blocked_reason: status === "blocked" ? blockedReason ?? null : null })
      .eq("id", assignmentId)
      .select()
      .maybeSingle();
    if (error || !data) return undefined;
    const updated = fromAssignmentRow(data as AssignmentRow);
    await setWorkOrderStatus(updated.workOrderId, status);
    return updated;
  }
  let updated: Assignment | undefined;
  assignments = assignments.map((a) => {
    if (a.id !== assignmentId) return a;
    updated = { ...a, status, blockedReason: status === "blocked" ? blockedReason : undefined };
    return updated;
  });
  if (updated) workOrderStatusOverrides.set(updated.workOrderId, status);
  return updated;
}

export async function reassignCrew(workOrderId: string, newCrewId: string): Promise<Assignment> {
  // A replan after a blockage is logged as a fresh assignment rather than an
  // edit, so the decision log keeps a full trail of "who was assigned, when,
  // and why it changed" instead of overwriting the record of what happened.
  return createAssignment(workOrderId, newCrewId);
}

async function setWorkOrderStatus(workOrderId: string, status: WorkOrderStatus): Promise<void> {
  if (!supabase) {
    workOrderStatusOverrides.set(workOrderId, status);
    return;
  }
  await supabase
    .from("work_order_status_overrides")
    .upsert({ work_order_id: workOrderId, status, updated_at: new Date().toISOString() });
}

export async function logDecision(entry: {
  workOrderId: string;
  crewId: string;
  decisionMaker: string;
  reasoning: string;
  scoreBreakdown?: ScoreBreakdown;
}): Promise<Decision> {
  if (supabase) {
    const { data, error } = await supabase
      .from("decisions")
      .insert({
        work_order_id: entry.workOrderId,
        crew_id: entry.crewId,
        decision_maker: entry.decisionMaker,
        reasoning: entry.reasoning,
        score_breakdown: entry.scoreBreakdown ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to log decision.");
    return fromDecisionRow(data as DecisionRow);
  }
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

export async function getDecisions(): Promise<Decision[]> {
  if (supabase) {
    const { data } = await supabase.from("decisions").select("*").order("created_at", { ascending: false });
    return (data ?? []).map((row) => fromDecisionRow(row as DecisionRow));
  }
  return [...decisions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getDecisionsForWorkOrder(workOrderId: string): Promise<Decision[]> {
  const all = await getDecisions();
  return all.filter((d) => d.workOrderId === workOrderId);
}

/** Test-only escape hatch so each test file starts from a clean slate. Only
 * resets the in-memory fallback, tests run without Supabase env vars set. */
export function __resetStoreForTests(): void {
  workOrderStatusOverrides = new Map();
  assignments = [];
  decisions = [];
  idCounter = 0;
}
