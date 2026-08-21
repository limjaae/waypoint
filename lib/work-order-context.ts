import { assets, crews, locations, maintenanceRecords, workOrders } from "./seed-data";
import { distanceKm } from "./scoring";
import { getAssignmentForWorkOrder, getWorkOrderStatus } from "./store";
import { Asset, Crew, Location, MaintenanceRecord, WorkOrder, WorkOrderStatus } from "./types";

export interface NearbyCrew {
  crew: Crew;
  distanceKm: number;
  hasCertification: boolean;
}

export interface RelatedWorkOrder {
  workOrder: WorkOrder;
  status: WorkOrderStatus;
  relationship: "same_asset" | "same_location";
}

export interface WorkOrderContext {
  workOrder: WorkOrder;
  status: WorkOrderStatus;
  asset: Asset;
  location: Location;
  maintenanceHistory: MaintenanceRecord[];
  nearbyCrews: NearbyCrew[];
  relatedWorkOrders: RelatedWorkOrder[];
  currentAssignment: ReturnType<typeof getAssignmentForWorkOrder>;
}

const NEARBY_RADIUS_KM = 60;

/** Pulls every piece of context a work order needs: location, asset, crews
 * nearby, and any related work orders. */
export function buildWorkOrderContext(workOrderId: string): WorkOrderContext | null {
  const workOrder = workOrders.find((wo) => wo.id === workOrderId);
  if (!workOrder) return null;

  const asset = assets.find((a) => a.id === workOrder.assetId);
  if (!asset) return null;

  const location = locations.find((l) => l.id === asset.locationId);
  if (!location) return null;

  const maintenanceHistory = maintenanceRecords
    .filter((m) => m.assetId === asset.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const nearbyCrews: NearbyCrew[] = crews
    .map((crew) => {
      const crewLocation = locations.find((l) => l.id === crew.locationId);
      const km = crewLocation ? distanceKm(location, crewLocation) : Number.POSITIVE_INFINITY;
      return {
        crew,
        distanceKm: Math.round(km * 10) / 10,
        hasCertification: crew.certifications.includes(workOrder.requiredCapability),
      };
    })
    .filter((entry) => entry.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const relatedWorkOrders: RelatedWorkOrder[] = workOrders
    .filter((wo) => wo.id !== workOrder.id)
    .filter((wo) => {
      const otherAsset = assets.find((a) => a.id === wo.assetId);
      return wo.assetId === asset.id || otherAsset?.locationId === location.id;
    })
    .map((wo) => ({
      workOrder: wo,
      status: getWorkOrderStatus(wo.id),
      relationship: wo.assetId === asset.id ? ("same_asset" as const) : ("same_location" as const),
    }));

  return {
    workOrder,
    status: getWorkOrderStatus(workOrder.id),
    asset,
    location,
    maintenanceHistory,
    nearbyCrews,
    relatedWorkOrders,
    currentAssignment: getAssignmentForWorkOrder(workOrder.id),
  };
}
