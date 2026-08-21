import { Asset, Crew, Location, WorkOrder } from "./types";

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
];
