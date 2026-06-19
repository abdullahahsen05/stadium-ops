"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { clientPOs as basePOs, clientInvoices as baseInvoices } from "./data";
import { isOverdue, isDueSoon, computePaymentStatus } from "./utils";
import type {
  ClientPO, ClientInvoice, ClientVendor, ClientRecord, ClientMutation,
  ClientPOEdit, ClientInvoiceEdit, ClientActivity, ClientStats
} from "./types";

const MUTATIONS_KEY   = "stadiumops_client_mutations_v1";
const PO_EDITS_KEY    = "stadiumops_client_po_edits_v1";
const INV_EDITS_KEY   = "stadiumops_client_inv_edits_v1";
const ACTIVITY_KEY    = "stadiumops_client_activity_v1";
const NEW_POS_KEY        = "stadiumops_client_new_pos_v1";
const NEW_INVOICES_KEY   = "stadiumops_client_new_invoices_v1";
const NEW_VENDORS_KEY    = "stadiumops_client_new_vendors_v1";
const DEL_POS_KEY        = "stadiumops_client_deleted_pos_v1";
const DEL_INVOICES_KEY   = "stadiumops_client_deleted_invoices_v1";

interface ClientDataContextValue {
  clientPOs: ClientPO[];
  clientInvoices: ClientInvoice[];
  clientVendors: ClientVendor[];
  clientRecords: ClientRecord[];
  mutations: ClientMutation[];
  poEdits: ClientPOEdit[];
  invoiceEdits: ClientInvoiceEdit[];
  clientActivity: ClientActivity[];
  stats: ClientStats;
  applyMutation: (m: ClientMutation) => void;
  applyPOEdit: (edit: ClientPOEdit) => void;
  applyInvoiceEdit: (edit: ClientInvoiceEdit) => void;
  addClientPO: (po: ClientPO) => void;
  addClientInvoice: (inv: ClientInvoice) => void;
  addClientVendor: (vendor: ClientVendor) => void;
  updateNewPO: (id: string, updates: Partial<ClientPO>) => void;
  updateNewInvoice: (id: string, updates: Partial<ClientInvoice>) => void;
  deleteClientPO: (id: string) => void;
  deleteClientInvoice: (id: string) => void;
  deleteClientVendor: (id: string) => void;
  addClientActivity: (a: Omit<ClientActivity, "id" | "timestamp">) => void;
  resetClientData: () => void;
}

const ClientDataContext = createContext<ClientDataContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const [mutations, setMutations] = useState<ClientMutation[]>([]);
  const [poEdits, setPoEdits] = useState<ClientPOEdit[]>([]);
  const [invoiceEdits, setInvoiceEdits] = useState<ClientInvoiceEdit[]>([]);
  const [clientActivity, setClientActivity] = useState<ClientActivity[]>([]);
  const [newPOs, setNewPOs] = useState<ClientPO[]>([]);
  const [newInvoices, setNewInvoices] = useState<ClientInvoice[]>([]);
  const [newVendors, setNewVendors] = useState<ClientVendor[]>([]);
  const [deletedPOIds, setDeletedPOIds] = useState<string[]>([]);
  const [deletedInvoiceIds, setDeletedInvoiceIds] = useState<string[]>([]);

  useEffect(() => {
    setMutations(loadJson(MUTATIONS_KEY, []));
    setPoEdits(loadJson(PO_EDITS_KEY, []));
    setInvoiceEdits(loadJson(INV_EDITS_KEY, []));
    setClientActivity(loadJson(ACTIVITY_KEY, []));
    setNewPOs(loadJson(NEW_POS_KEY, []));
    setNewInvoices(loadJson(NEW_INVOICES_KEY, []));
    setNewVendors(loadJson(NEW_VENDORS_KEY, []));
    setDeletedPOIds(loadJson(DEL_POS_KEY, []));
    setDeletedInvoiceIds(loadJson(DEL_INVOICES_KEY, []));
  }, []);

  // All POs with edits applied (excluding deleted)
  const resolvedPOs = useMemo<ClientPO[]>(() => {
    const allPOs = [...basePOs, ...newPOs].filter((po) => !deletedPOIds.includes(po.id));
    return allPOs.map((po) => {
      const e = poEdits.find((x) => x.poId === po.id);
      if (!e) return po;
      return {
        ...po,
        ...(e.discipline !== undefined && { discipline: e.discipline }),
        ...(e.vendorName !== undefined && { vendorName: e.vendorName }),
        ...(e.initiatedBy !== undefined && { initiatedBy: e.initiatedBy }),
        ...(e.dateIssued !== undefined && { dateIssued: e.dateIssued }),
        ...(e.description !== undefined && { description: e.description }),
        ...(e.quantity !== undefined && { quantity: e.quantity }),
        ...(e.currency !== undefined && { currency: e.currency }),
        ...(e.poAmount !== undefined && { poAmount: e.poAmount }),
        ...(e.amountWithoutVatSar !== undefined && { amountWithoutVatSar: e.amountWithoutVatSar }),
        ...(e.amountWithVatSar !== undefined && { amountWithVatSar: e.amountWithVatSar }),
        ...(e.incoTerm !== undefined && { incoTerm: e.incoTerm }),
        ...(e.paymentTerm !== undefined && { paymentTerm: e.paymentTerm }),
        ...(e.notes !== undefined && { notes: e.notes }),
      };
    });
  }, [poEdits, newPOs, deletedPOIds]);

  // All invoices with edits + mutations applied (excluding deleted)
  const resolvedInvoices = useMemo<ClientInvoice[]>(() => {
    const allInvoices = [...baseInvoices, ...newInvoices].filter((inv) => !deletedInvoiceIds.includes(inv.id));
    return allInvoices.map((inv) => {
      const e = invoiceEdits.find((x) => x.invoiceId === inv.id);
      const m = mutations.find((x) => x.invoiceId === inv.id);

      let result: ClientInvoice = { ...inv };

      if (e) {
        if (e.invoiceRef !== undefined) result = { ...result, invoiceRef: e.invoiceRef };
        if (e.invoiceDate !== undefined) result = { ...result, invoiceDate: e.invoiceDate };
        if (e.invoiceAmountWithVat !== undefined) result = { ...result, invoiceAmountWithVat: e.invoiceAmountWithVat };
        if (e.paymentRequestedAmount !== undefined) result = { ...result, paymentRequestedAmount: e.paymentRequestedAmount };
        if (e.paymentRequestedDate !== undefined) result = { ...result, paymentRequestedDate: e.paymentRequestedDate };
        if (e.creditDays !== undefined) result = { ...result, creditDays: e.creditDays };
        if (e.dueDate !== undefined) result = { ...result, dueDate: e.dueDate };
        if (e.notes !== undefined) result = { ...result, notes: e.notes };
        // Only apply edit status if no mutation (mutation takes priority)
        if (e.paymentStatus !== undefined && !m) result = { ...result, paymentStatus: e.paymentStatus };
      }

      if (m) {
        const computedStatus = computePaymentStatus(m.paidAmount, result.invoiceAmountWithVat, m.paymentStatus);
        result = {
          ...result,
          paidAmount: m.paidAmount,
          paymentReceivedDate: m.paymentReceivedDate,
          paymentStatus: computedStatus,
          ...(m.notes && { notes: m.notes }),
        };
      }

      return result;
    });
  }, [mutations, invoiceEdits, newInvoices, deletedInvoiceIds]);

  const clientRecords = useMemo<ClientRecord[]>(() => {
    return resolvedPOs.map((po) => {
      const invoice = resolvedInvoices.find((inv) => inv.cpoId === po.id);
      const pendingAmount = invoice ? Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount) : 0;
      const paid = invoice?.paymentStatus === "Paid 100%";
      const partial = invoice?.paymentStatus === "Partially Paid";
      return {
        po,
        invoice,
        pendingAmount,
        isOverdue: invoice ? isOverdue(invoice.dueDate) && !paid && !partial : false,
        isDueSoon: invoice ? isDueSoon(invoice.dueDate) && !paid : false,
      };
    });
  }, [resolvedPOs, resolvedInvoices]);

  const stats = useMemo<ClientStats>(() => {
    const totalPoValueWithVat = resolvedPOs.reduce((s, po) => s + po.amountWithVatSar, 0);
    const totalInvoiceValueWithVat = resolvedInvoices.reduce((s, inv) => s + inv.invoiceAmountWithVat, 0);
    const totalPaymentRequested = resolvedInvoices.reduce((s, inv) => s + inv.paymentRequestedAmount, 0);
    const totalPaid = resolvedInvoices.reduce((s, inv) => s + inv.paidAmount, 0);
    const totalPending = resolvedInvoices.reduce((s, inv) => s + Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount), 0);
    const overdueRecords = clientRecords.filter((r) => r.isOverdue);
    const totalOverdueAmount = overdueRecords.reduce((s, r) => s + r.pendingAmount, 0);
    const paidCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "Paid 100%").length;
    const partiallyPaidCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "Partially Paid").length;
    const invoiceSentToHoCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "Invoice sent to HO").length;
    const toBeProcessedCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "To be Processed").length;
    const overdueCount = overdueRecords.length;
    const poCount = resolvedPOs.length;
    const invoiceCount = resolvedInvoices.length;
    const allVendorNames = new Set([...resolvedPOs.map((p) => p.vendorName), ...newVendors.map((v) => v.name)]);
    const vendorCount = allVendorNames.size;
    const disciplineCount = new Set(resolvedPOs.map((po) => po.discipline)).size;
    const invWithCreditDays = resolvedInvoices.filter((inv) => inv.creditDays > 0);
    const avgCreditDays = invWithCreditDays.length
      ? Math.round(invWithCreditDays.reduce((s, inv) => s + inv.creditDays, 0) / invWithCreditDays.length)
      : 0;

    return {
      totalPoValueWithVat, totalInvoiceValueWithVat, totalPaymentRequested,
      totalPaid, totalPending, totalOverdueAmount,
      paidCount, partiallyPaidCount, invoiceSentToHoCount, toBeProcessedCount,
      overdueCount, poCount, invoiceCount, vendorCount, disciplineCount, avgCreditDays,
    };
  }, [resolvedPOs, resolvedInvoices, clientRecords, newVendors]);

  const applyMutation = useCallback((m: ClientMutation) => {
    setMutations((prev) => {
      const idx = prev.findIndex((x) => x.invoiceId === m.invoiceId);
      const next = idx >= 0 ? prev.map((x, i) => (i === idx ? m : x)) : [...prev, m];
      saveJson(MUTATIONS_KEY, next);
      return next;
    });
  }, []);

  const applyPOEdit = useCallback((edit: ClientPOEdit) => {
    setPoEdits((prev) => {
      const idx = prev.findIndex((x) => x.poId === edit.poId);
      const next = idx >= 0 ? prev.map((x, i) => (i === idx ? edit : x)) : [...prev, edit];
      saveJson(PO_EDITS_KEY, next);
      return next;
    });
  }, []);

  const applyInvoiceEdit = useCallback((edit: ClientInvoiceEdit) => {
    setInvoiceEdits((prev) => {
      const idx = prev.findIndex((x) => x.invoiceId === edit.invoiceId);
      const next = idx >= 0 ? prev.map((x, i) => (i === idx ? edit : x)) : [...prev, edit];
      saveJson(INV_EDITS_KEY, next);
      return next;
    });
  }, []);

  const addClientPO = useCallback((po: ClientPO) => {
    setNewPOs((prev) => {
      const next = [...prev, po];
      saveJson(NEW_POS_KEY, next);
      return next;
    });
  }, []);

  const addClientInvoice = useCallback((inv: ClientInvoice) => {
    setNewInvoices((prev) => {
      const next = [...prev, inv];
      saveJson(NEW_INVOICES_KEY, next);
      return next;
    });
  }, []);

  const addClientVendor = useCallback((vendor: ClientVendor) => {
    setNewVendors((prev) => {
      const next = [...prev, vendor];
      saveJson(NEW_VENDORS_KEY, next);
      return next;
    });
  }, []);

  const updateNewPO = useCallback((id: string, updates: Partial<ClientPO>) => {
    setNewPOs((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveJson(NEW_POS_KEY, next);
      return next;
    });
  }, []);

  const updateNewInvoice = useCallback((id: string, updates: Partial<ClientInvoice>) => {
    setNewInvoices((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      saveJson(NEW_INVOICES_KEY, next);
      return next;
    });
  }, []);

  const deleteClientPO = useCallback((id: string) => {
    // If it's a new (user-created) PO, remove it directly
    setNewPOs((prev) => {
      const isNew = prev.some((p) => p.id === id);
      if (isNew) {
        const next = prev.filter((p) => p.id !== id);
        saveJson(NEW_POS_KEY, next);
        return next;
      }
      return prev;
    });
    // Soft-delete base records
    setDeletedPOIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveJson(DEL_POS_KEY, next);
      return next;
    });
  }, []);

  const deleteClientInvoice = useCallback((id: string) => {
    setNewInvoices((prev) => {
      const isNew = prev.some((i) => i.id === id);
      if (isNew) {
        const next = prev.filter((i) => i.id !== id);
        saveJson(NEW_INVOICES_KEY, next);
        return next;
      }
      return prev;
    });
    setDeletedInvoiceIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveJson(DEL_INVOICES_KEY, next);
      return next;
    });
  }, []);

  const deleteClientVendor = useCallback((id: string) => {
    setNewVendors((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveJson(NEW_VENDORS_KEY, next);
      return next;
    });
  }, []);

  const addClientActivity = useCallback((a: Omit<ClientActivity, "id" | "timestamp">) => {
    const entry: ClientActivity = {
      ...a,
      id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setClientActivity((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      saveJson(ACTIVITY_KEY, next);
      return next;
    });
  }, []);

  const resetClientData = useCallback(() => {
    setMutations([]);
    setPoEdits([]);
    setInvoiceEdits([]);
    setClientActivity([]);
    setNewPOs([]);
    setNewInvoices([]);
    setNewVendors([]);
    setDeletedPOIds([]);
    setDeletedInvoiceIds([]);
    saveJson(MUTATIONS_KEY, []);
    saveJson(PO_EDITS_KEY, []);
    saveJson(INV_EDITS_KEY, []);
    saveJson(ACTIVITY_KEY, []);
    saveJson(NEW_POS_KEY, []);
    saveJson(NEW_INVOICES_KEY, []);
    saveJson(NEW_VENDORS_KEY, []);
    saveJson(DEL_POS_KEY, []);
    saveJson(DEL_INVOICES_KEY, []);
  }, []);

  const clientVendors = useMemo(() => newVendors, [newVendors]);

  return (
    <ClientDataContext.Provider value={{
      clientPOs: resolvedPOs,
      clientInvoices: resolvedInvoices,
      clientVendors,
      clientRecords,
      mutations,
      poEdits,
      invoiceEdits,
      clientActivity,
      stats,
      applyMutation,
      applyPOEdit,
      applyInvoiceEdit,
      addClientPO,
      addClientInvoice,
      addClientVendor,
      updateNewPO,
      updateNewInvoice,
      deleteClientPO,
      deleteClientInvoice,
      deleteClientVendor,
      addClientActivity,
      resetClientData,
    }}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  const ctx = useContext(ClientDataContext);
  if (!ctx) throw new Error("useClientData must be used within ClientDataProvider");
  return ctx;
}
