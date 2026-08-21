"use server";

import { revalidatePath } from "next/cache";
import { getRankingForWorkOrder } from "@/lib/planning";
import { getAssignmentForWorkOrder, logDecision, reassignCrew, updateAssignmentStatus } from "@/lib/store";
import { BlockedReason } from "@/lib/types";
import { BLOCKED_REASONS } from "@/lib/execution";

function revalidateWorkOrder(workOrderId: string) {
  revalidatePath("/");
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath(`/work-orders/${workOrderId}/execute`);
  revalidatePath("/decisions");
}

export async function startWork(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const assignment = await getAssignmentForWorkOrder(workOrderId);
  if (!assignment) throw new Error(`No assignment on ${workOrderId} to start.`);
  await updateAssignmentStatus(assignment.id, "in_progress");
  revalidateWorkOrder(workOrderId);
}

export async function markComplete(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const assignment = await getAssignmentForWorkOrder(workOrderId);
  if (!assignment) throw new Error(`No assignment on ${workOrderId} to complete.`);
  await updateAssignmentStatus(assignment.id, "complete");
  revalidateWorkOrder(workOrderId);
}

export async function reportBlocked(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const reason = String(formData.get("reason") ?? "") as BlockedReason;

  if (!BLOCKED_REASONS.some((r) => r.value === reason)) {
    throw new Error(`Invalid blocked reason: ${reason}`);
  }

  const assignment = await getAssignmentForWorkOrder(workOrderId);
  if (!assignment) throw new Error(`No assignment on ${workOrderId} to block.`);
  await updateAssignmentStatus(assignment.id, "blocked", reason);
  revalidateWorkOrder(workOrderId);
}

export async function resumeSameCrew(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const assignment = await getAssignmentForWorkOrder(workOrderId);
  if (!assignment) throw new Error(`No assignment on ${workOrderId} to resume.`);
  await updateAssignmentStatus(assignment.id, "in_progress");
  revalidateWorkOrder(workOrderId);
}

export async function reassignAfterBlock(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const crewId = String(formData.get("crewId") ?? "");
  const decisionMaker = String(formData.get("decisionMaker") ?? "").trim();
  const reasoning = String(formData.get("reasoning") ?? "").trim();

  if (!workOrderId || !crewId || !decisionMaker || !reasoning) {
    throw new Error("Missing required fields for reassignment.");
  }

  const ranking = getRankingForWorkOrder(workOrderId);
  const breakdown = ranking?.ranked.find((r) => r.crewId === crewId);
  if (!breakdown) throw new Error(`Crew ${crewId} is not a valid candidate for ${workOrderId}.`);

  await reassignCrew(workOrderId, crewId);
  await logDecision({ workOrderId, crewId, decisionMaker, reasoning, scoreBreakdown: breakdown });
  revalidateWorkOrder(workOrderId);
}
