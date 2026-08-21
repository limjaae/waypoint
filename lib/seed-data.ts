import { Asset, Crew, Location, MaintenanceRecord, WorkOrder } from "./types";

// Reference data for the Western Sydney demo scenario described in the PRD.
// Coordinates are real (roughly correct for the named suburbs); everything else
// (asset names, crew rosters, work order details) is synthetic and clearly
// labelled as such wherever it's shown in the product.

export const locations: Location[] = [
  { id: "loc-1", name: "Western Sydney Substation", latitude: -33.8148, longitude: 150.8567, region: "NSW" },
  { id: "loc-2", name: "Parramatta Depot", latitude: -33.8150, longitude: 151.0011, region: "NSW" },
  { id: "loc-3", name: "Penrith Depot", latitude: -33.7511, longitude: 150.6942, region: "NSW" },
  { id: "loc-4", name: "Blacktown Depot", latitude: -33.7688, longitude: 150.9063, region: "NSW" },
];

export const assets: Asset[] = [
  {
    id: "asset-1",
    locationId: "loc-1",
    name: "Transformer T-104",
    assetType: "transformer",
    criticality: "high",
    condition: "critical",
    replacementCost: 480000,
    lastMaintenance: "2026-03-14",
  },
  {
    id: "asset-2",
    locationId: "loc-1",
    name: "Feeder Line F-22",
    assetType: "feeder_line",
    criticality: "medium",
    condition: "degraded",
    replacementCost: 90000,
    lastMaintenance: "2026-05-02",
  },
  {
    id: "asset-3",
    locationId: "loc-1",
    name: "Circuit Breaker CB-9",
    assetType: "circuit_breaker",
    criticality: "medium",
    condition: "degraded",
    replacementCost: 62000,
    lastMaintenance: "2026-06-20",
  },
];

// Maintenance history per asset, most recent first. Powers the Work Order
// Workspace's asset-history panel.
export const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: "maint-1",
    assetId: "asset-1",
    date: "2026-03-14",
    type: "Scheduled inspection",
    notes: "Oil temperature within range, minor corrosion noted on housing bolts, flagged for repaint.",
  },
  {
    id: "maint-2",
    assetId: "asset-1",
    date: "2025-09-02",
    type: "Load test",
    notes: "Passed rated load test at 110% nameplate capacity for 30 minutes.",
  },
  {
    id: "maint-3",
    assetId: "asset-2",
    date: "2026-05-02",
    type: "Scheduled inspection",
    notes: "Insulation resistance trending down on span 4, recommended re-inspection within 90 days.",
  },
  {
    id: "maint-4",
    assetId: "asset-3",
    date: "2026-06-20",
    type: "Fault investigation",
    notes: "Nuisance trip investigated, no fault found, breaker mechanism showing early wear.",
  },
];

export const crews: Crew[] = [
  {
    id: "crew-07",
    name: "Crew 07",
    locationId: "loc-2",
    skills: ["electrical", "high_voltage"],
    certifications: ["high_voltage_electrical"],
    availability: "available",
    currentWorkload: "low",
  },
  {
    id: "crew-12",
    name: "Crew 12",
    locationId: "loc-3",
    skills: ["mechanical", "general"],
    certifications: ["mechanical"],
    availability: "available",
    currentWorkload: "medium",
  },
  {
    id: "crew-04",
    name: "Crew 04",
    locationId: "loc-4",
    skills: ["general"],
    certifications: ["general"],
    availability: "busy",
    currentWorkload: "high",
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: "wo-1048",
    assetId: "asset-1",
    issueType: "Critical transformer degradation",
    priority: "critical",
    status: "open",
    requiredCapability: "high_voltage_electrical",
    customerImpact: 1240,
    estimatedDurationHours: 4.5,
    createdAt: "2026-08-20T02:00:00Z",
  },
  {
    id: "wo-1052",
    assetId: "asset-2",
    issueType: "Scheduled maintenance overdue",
    priority: "high",
    status: "open",
    requiredCapability: "mechanical",
    customerImpact: 310,
    estimatedDurationHours: 2,
    createdAt: "2026-08-20T02:15:00Z",
  },
  {
    id: "wo-1060",
    assetId: "asset-3",
    issueType: "Breaker trip flagged for inspection",
    priority: "medium",
    status: "open",
    requiredCapability: "high_voltage_electrical",
    customerImpact: 90,
    estimatedDurationHours: 1.5,
    createdAt: "2026-08-20T02:20:00Z",
  },
];
