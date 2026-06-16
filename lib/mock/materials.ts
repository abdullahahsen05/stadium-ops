import type { Material } from "@/lib/types";

export const mockMaterials: Material[] = [
  {
    id: "m-001", code: "MAT-001", name: "Cement Bags (50kg)", category: "Concrete",
    unit: "Bags", currentStock: 2400, reorderLevel: 1000, unitCost: 1200,
    primaryVendorId: "v-001", zone: "Main Pitch", lastUpdated: "2026-06-14",
  },
  {
    id: "m-002", code: "MAT-002", name: "Steel Rebars (12mm)", category: "Steel",
    unit: "Tons", currentStock: 180, reorderLevel: 200, unitCost: 195000,
    primaryVendorId: "v-002", zone: "North Stand", lastUpdated: "2026-06-15",
  },
  {
    id: "m-003", code: "MAT-003", name: "Precast Concrete Panels", category: "Concrete",
    unit: "Panels", currentStock: 340, reorderLevel: 150, unitCost: 28000,
    primaryVendorId: "v-001", zone: "South Stand", lastUpdated: "2026-06-13",
  },
  {
    id: "m-004", code: "MAT-004", name: "Electrical Cables (3-Core)", category: "Electrical",
    unit: "Meters", currentStock: 8500, reorderLevel: 5000, unitCost: 185,
    primaryVendorId: "v-003", zone: "Concourse Level", lastUpdated: "2026-06-15",
  },
  {
    id: "m-005", code: "MAT-005", name: "Drainage Pipes (200mm)", category: "Drainage",
    unit: "Lengths", currentStock: 420, reorderLevel: 300, unitCost: 3800,
    primaryVendorId: "v-006", zone: "Drainage Zone", lastUpdated: "2026-06-12",
  },
  {
    id: "m-006", code: "MAT-006", name: "Stadium Seats (Standard)", category: "Seating",
    unit: "Units", currentStock: 1200, reorderLevel: 5000, unitCost: 8500,
    primaryVendorId: "v-005", zone: "East Stand", lastUpdated: "2026-06-10",
  },
  {
    id: "m-007", code: "MAT-007", name: "Floodlight Poles (30m)", category: "Lighting",
    unit: "Units", currentStock: 12, reorderLevel: 8, unitCost: 320000,
    primaryVendorId: "v-008", zone: "Floodlight Zone", lastUpdated: "2026-06-14",
  },
  {
    id: "m-008", code: "MAT-008", name: "Glass Panels (Tempered)", category: "Glass",
    unit: "Sqm", currentStock: 680, reorderLevel: 400, unitCost: 4200,
    primaryVendorId: "v-007", zone: "VIP Pavilion", lastUpdated: "2026-06-11",
  },
  {
    id: "m-009", code: "MAT-009", name: "Ceramic Tiles (600x600)", category: "Finishing",
    unit: "Sqm", currentStock: 2800, reorderLevel: 2000, unitCost: 1800,
    primaryVendorId: "v-001", zone: "Concourse Level", lastUpdated: "2026-06-13",
  },
  {
    id: "m-010", code: "MAT-010", name: "Exterior Paint (20L)", category: "Finishing",
    unit: "Tins", currentStock: 120, reorderLevel: 200, unitCost: 8500,
    primaryVendorId: "v-003", zone: "North Stand", lastUpdated: "2026-06-15",
  },
  {
    id: "m-011", code: "MAT-011", name: "River Sand", category: "Aggregates",
    unit: "Cubic Meters", currentStock: 3200, reorderLevel: 1500, unitCost: 3200,
    primaryVendorId: "v-001", zone: "Main Pitch", lastUpdated: "2026-06-14",
  },
  {
    id: "m-012", code: "MAT-012", name: "Crushed Gravel (20mm)", category: "Aggregates",
    unit: "Cubic Meters", currentStock: 2600, reorderLevel: 1200, unitCost: 2800,
    primaryVendorId: "v-001", zone: "Parking Area", lastUpdated: "2026-06-14",
  },
  {
    id: "m-013", code: "MAT-013", name: "Steel Rebars (16mm)", category: "Steel",
    unit: "Tons", currentStock: 90, reorderLevel: 150, unitCost: 200000,
    primaryVendorId: "v-002", zone: "West Stand", lastUpdated: "2026-06-15",
  },
  {
    id: "m-014", code: "MAT-014", name: "Electrical Conduits (PVC)", category: "Electrical",
    unit: "Meters", currentStock: 3400, reorderLevel: 3000, unitCost: 95,
    primaryVendorId: "v-003", zone: "Player Tunnel", lastUpdated: "2026-06-12",
  },
  {
    id: "m-015", code: "MAT-015", name: "VIP Seats (Premium)", category: "Seating",
    unit: "Units", currentStock: 80, reorderLevel: 500, unitCost: 22000,
    primaryVendorId: "v-005", zone: "VIP Pavilion", lastUpdated: "2026-06-10",
  },
];
