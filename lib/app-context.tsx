"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppState, Activity, Alert, Material, Vendor, PurchaseOrder, Delivery, Invoice, Payment, DebrisRecord } from "./types";
import { loadState, saveState, resetState, getInitialState, generateId } from "./store";
import { toast } from "sonner";

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
  resetDemo: () => void;
  // Convenience mutators
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  updateVendor: (id: string, patch: Partial<Vendor>) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void;
  addDelivery: (delivery: Delivery) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  addPayment: (payment: Payment) => void;
  addDebris: (record: DebrisRecord) => void;
  addAlert: (alert: Omit<Alert, "id" | "createdAt">) => void;
  updateAlert: (id: string, patch: Partial<Alert>) => void;
  addVendor: (vendor: Vendor) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Match the server HTML on first render, then hydrate from localStorage.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(loadState());
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Persist on every state change
  useEffect(() => {
    if (!hasHydrated) return;
    saveState(state);
  }, [hasHydrated, state]);

  const addActivity = useCallback((activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: generateId("act"),
      timestamp: new Date().toISOString(),
    };
    setState((s) => ({ ...s, activity: [newActivity, ...s.activity] }));
  }, []);

  const resetDemo = useCallback(() => {
    resetState();
    setState(getInitialState());
    toast.success("Demo data has been reset to defaults.");
  }, []);

  const addMaterial = useCallback((material: Material) => {
    setState((s) => ({ ...s, materials: [...s.materials, material] }));
  }, []);

  const updateMaterial = useCallback((id: string, patch: Partial<Material>) => {
    setState((s) => ({
      ...s,
      materials: s.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const updateVendor = useCallback((id: string, patch: Partial<Vendor>) => {
    setState((s) => ({
      ...s,
      vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  }, []);

  const addVendor = useCallback((vendor: Vendor) => {
    setState((s) => ({ ...s, vendors: [...s.vendors, vendor] }));
  }, []);

  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setState((s) => ({ ...s, purchaseOrders: [po, ...s.purchaseOrders] }));
  }, []);

  const updatePurchaseOrder = useCallback((id: string, patch: Partial<PurchaseOrder>) => {
    setState((s) => ({
      ...s,
      purchaseOrders: s.purchaseOrders.map((po) => (po.id === id ? { ...po, ...patch } : po)),
    }));
  }, []);

  const addDelivery = useCallback((delivery: Delivery) => {
    setState((s) => {
      const newDeliveries = [delivery, ...s.deliveries];
      // Update material stock
      const newMaterials = s.materials.map((m) => {
        if (m.id === delivery.materialId) {
          return { ...m, currentStock: m.currentStock + delivery.deliveredQty, lastUpdated: new Date().toISOString().split("T")[0] };
        }
        return m;
      });
      // Update PO delivered qty
      const newPOs = s.purchaseOrders.map((po) => {
        if (po.id === delivery.poId) {
          const updatedItems = po.items.map((item) => {
            if (item.materialId === delivery.materialId) {
              return { ...item, deliveredQty: item.deliveredQty + delivery.deliveredQty };
            }
            return item;
          });
          const allDelivered = updatedItems.every((i) => i.deliveredQty >= i.quantity);
          return {
            ...po,
            items: updatedItems,
            status: allDelivered ? ("Delivered" as const) : ("Partial" as const),
          };
        }
        return po;
      });
      return { ...s, deliveries: newDeliveries, materials: newMaterials, purchaseOrders: newPOs };
    });
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] }));
  }, []);

  const updateInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)),
    }));
  }, []);

  const addPayment = useCallback((payment: Payment) => {
    setState((s) => {
      const newPayments = [payment, ...s.payments];
      // Mark invoice paid if full amount
      const invoice = s.invoices.find((inv) => inv.id === payment.invoiceId);
      const newInvoices = invoice
        ? s.invoices.map((inv) =>
            inv.id === payment.invoiceId ? { ...inv, status: "Paid" as const } : inv
          )
        : s.invoices;
      return { ...s, payments: newPayments, invoices: newInvoices };
    });
  }, []);

  const addDebris = useCallback((record: DebrisRecord) => {
    setState((s) => ({ ...s, debris: [record, ...s.debris] }));
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, "id" | "createdAt">) => {
    const newAlert: Alert = {
      ...alert,
      id: generateId("alr"),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, alerts: [newAlert, ...s.alerts] }));
  }, []);

  const updateAlert = useCallback((id: string, patch: Partial<Alert>) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setState,
        addActivity,
        resetDemo,
        addMaterial,
        updateMaterial,
        updateVendor,
        addVendor,
        addPurchaseOrder,
        updatePurchaseOrder,
        addDelivery,
        addInvoice,
        updateInvoice,
        addPayment,
        addDebris,
        addAlert,
        updateAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
