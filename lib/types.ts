export type Criticality = "low" | "medium" | "high";
export type AssetCondition = "normal" | "degraded" | "critical";
export type Availability = "available" | "busy" | "off_shift";
export type Workload = "low" | "medium" | "high";
export type Priority = "critical" | "high" | "medium" | "low";
export type WorkOrderStatus = "open" | "assigned" | "in_progress" | "blocked" | "complete";
export type AssignmentStatus = "assigned" | "in_progress" | "blocked" | "complete";

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

export interface Asset {
  id: string;
  locationId: string;
  name: string;
  assetType: string;
  criticality: Criticality;
  condition: AssetCondition;
  replacementCost?: number;
  lastMaintenance?: string;
}

export interface Crew {
  id: string;
  name: string;
  locationId: string;
  skills: string[];
  certifications: string[];
  availability: Availability;
  currentWorkload: Workload;
}

export interface WorkOrder {
  id: string;
  assetId: string;
  issueType: string;
  priority: Priority;
  status: WorkOrderStatus;
  requiredCapability: string;
  customerImpact: number;
  estimatedDurationHours: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  workOrderId: string;
  crewId: string;
  status: AssignmentStatus;
  blockedReason?: BlockedReason;
  assignedAt: string;
  estimatedCompletion?: string;
}

export interface ScoreBreakdown {
  crewId: string;
  crewName: string;
  priorityWeight: number;
  capabilityMatch: number;
  proximityScore: number;
  workloadPenalty: number;
  total: number;
  distanceKm: number;
  hasCertification: boolean;
}

export interface Decision {
  id: string;
  workOrderId: string;
  crewId: string;
  decisionMaker: string;
  reasoning: string;
  scoreBreakdown?: ScoreBreakdown;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  type: string;
  notes: string;
}

export type WeatherSeverity = "normal" | "watch" | "severe";

export interface WeatherSnapshot {
  locationId: string;
  temperatureC: number;
  windSpeedKmh: number;
  precipitationMm: number;
  weatherCode: number;
  conditionLabel: string;
  severity: WeatherSeverity;
  fetchedAt: string;
}

export type WeatherResult =
  | { status: "ok"; data: WeatherSnapshot }
  | { status: "unavailable"; reason: string };

export type BlockedReason =
  | "missing_equipment"
  | "weather"
  | "access_issue"
  | "needs_specialist";
