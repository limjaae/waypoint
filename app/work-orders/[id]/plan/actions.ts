"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRankingForWorkOrder } from "@/lib/planning";
import { createAssignment, logDecision } from "@/lib/store";

export async function confirmAssignment(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const crewId = String(formData.get("crewId") ?? "");
  const decisionMaker = String(formData.get("decisionMaker") ?? "").trim();
  const reasoning = String(formData.get("reasoning") ?? "").trim();

  if (!workOrderId || !crewId || !decisionMaker || !reasoning) {
    throw new Error("Missing required fields for assignment confirmation.");
  }

  // Recompute the ranking server-side rather than trusting a hidden score
  // field from the form, the score shown to the operator has to be the same
  // one that lands in the decision log, not whatever the client last saw.
  const ranking = getRankingForWorkOrder(workOrderId);
  if (!ranking) throw new Error(`Unknown work order: ${workOrderId}`);

  const breakdown = ranking.ranked.find((r) => r.crewId === crewId);
  if (!breakdown) throw new Error(`Crew ${crewId} is not a valid candidate for ${workOrderId}.`);

  createAssignment(workOrderId, crewId);
  logDecision({ workOrderId, crewId, decisionMaker, reasoning, scoreBreakdown: breakdown });

  revalidatePath("/");
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/decisions");
  redirect(`/work-orders/${workOrderId}/execute`);
}
