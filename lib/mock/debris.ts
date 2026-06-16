import type { DebrisRecord } from "@/lib/types";

export const mockDebris: DebrisRecord[] = [
  {
    id: "dbr-001", debrisNumber: "DBR-2026-001",
    type: "Concrete Waste", quantity: 45, unit: "Cubic Meters",
    zone: "North Stand", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-02", cost: 135000,
    disposalStatus: "Disposed", notes: "Formwork concrete overflow",
  },
  {
    id: "dbr-002", debrisNumber: "DBR-2026-002",
    type: "Steel Scrap", quantity: 8.5, unit: "Tons",
    zone: "South Stand", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-05", cost: 42500,
    disposalStatus: "Disposed", notes: "Rebar offcuts from cutting",
  },
  {
    id: "dbr-003", debrisNumber: "DBR-2026-003",
    type: "Mixed Construction Waste", quantity: 30, unit: "Cubic Meters",
    zone: "Main Pitch", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-08", cost: 90000,
    disposalStatus: "Removed", notes: "Cleared from pitch area",
  },
  {
    id: "dbr-004", debrisNumber: "DBR-2026-004",
    type: "Soil", quantity: 120, unit: "Cubic Meters",
    zone: "Parking Area", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-10", cost: 240000,
    disposalStatus: "Removed", notes: "Excavation soil",
  },
  {
    id: "dbr-005", debrisNumber: "DBR-2026-005",
    type: "Formwork Timber", quantity: 6, unit: "Tons",
    zone: "West Stand", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-12", cost: 36000,
    disposalStatus: "Disposed", notes: "Used formwork boards",
  },
  {
    id: "dbr-006", debrisNumber: "DBR-2026-006",
    type: "Packaging", quantity: 3.2, unit: "Tons",
    zone: "Concourse Level", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-14", cost: 22400,
    disposalStatus: "Scheduled", notes: "Cardboard and packing from deliveries",
  },
  {
    id: "dbr-007", debrisNumber: "DBR-2026-007",
    type: "Concrete Waste", quantity: 60, unit: "Cubic Meters",
    zone: "East Stand", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-16", cost: 180000,
    disposalStatus: "Pending", notes: "Today — awaiting truck allocation",
  },
  {
    id: "dbr-008", debrisNumber: "DBR-2026-008",
    type: "Electrical Waste", quantity: 0.8, unit: "Tons",
    zone: "Player Tunnel", removalVendor: "Urban Waste Disposal",
    removalDate: "2026-06-15", cost: 28000,
    disposalStatus: "Pending", notes: "Old wiring from tunnel",
  },
];
