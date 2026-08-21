import { assets, crews, locations, workOrders } from "./seed-data";
import { scoreCrewsForWorkOrder } from "./scoring";
import { getWorkOrderStatus } from "./store";
import { WorkOrder } from "./types";

export interface PriorityQueueItem {
  workOrder: WorkOrder;
  assetName: string;
  locationName: string;
  topCrewName: string | null;
  topCrewDistanceKm: number | null;
  restorationEstimateHours: number;
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function buildPriorityQueue(): PriorityQueueItem[] {
  const locationMap = new Map(locations.map((l) => [l.id, l]));

  const items = workOrders
    .filter((wo) => getWorkOrderStatus(wo.id) === "open")
    .map((workOrder) => {
      const asset = assets.find((a) => a.id === workOrder.assetId);
      if (!asset) throw new Error(`No asset found for work order ${workOrder.id}`);

      const assetLocation = locationMap.get(asset.locationId);
      if (!assetLocation) throw new Error(`No location found for asset ${asset.id}`);

      const ranked = scoreCrewsForWorkOrder(workOrder, asset, assetLocation, crews, locationMap);
      const top = ranked[0] ?? null;

      return {
        workOrder,
        assetName: asset.name,
        locationName: assetLocation.name,
        topCrewName: top?.crewName ?? null,
        topCrewDistanceKm: top?.distanceKm ?? null,
        restorationEstimateHours: workOrder.estimatedDurationHours,
      };
    });

  return items.sort((a, b) => PRIORITY_ORDER[a.workOrder.priority] - PRIORITY_ORDER[b.workOrder.priority]);
}
