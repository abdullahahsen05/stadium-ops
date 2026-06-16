import type { AppState } from "./types";
import {
  mockMaterials, mockVendors, mockPurchaseOrders,
  mockDeliveries, mockInvoices, mockPayments,
  mockDebris, mockAlerts, mockActivity,
} from "./mock";

const STORAGE_KEY = "stadiumops_demo_v1";

export function getInitialState(): AppState {
  return {
    materials: mockMaterials,
    vendors: mockVendors,
    purchaseOrders: mockPurchaseOrders,
    deliveries: mockDeliveries,
    invoices: mockInvoices,
    payments: mockPayments,
    debris: mockDebris,
    alerts: mockAlerts,
    activity: mockActivity,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    return JSON.parse(raw) as AppState;
  } catch {
    return getInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function resetState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateNumber(prefix: string, existingNumbers: string[]): string {
  const nums = existingNumbers
    .map((n) => parseInt(n.split("-").pop() ?? "0", 10))
    .filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isOverdue(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date(new Date().toDateString());
}

export function isDueSoon(dueDateStr: string, days = 3): boolean {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + days);
  return due >= now && due <= threshold;
}
