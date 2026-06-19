"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { clientPOs, clientInvoices } from "./data";
import { isOverdue, isDueSoon, computePaymentStatus } from "./utils";
import type {
  ClientPO, ClientInvoice, ClientRecord, ClientMutation,
  ClientPOEdit, ClientInvoiceEdit, ClientActivity, ClientStats
} from "./types";

const MUTATIONS_KEY = "stadiumops_client_mutations_v1";
const PO_EDITS_KEY = "stadiumops_client_po_edits_v1";
const INV_EDITS_KEY = "stadiumops_client_inv_edits_v1";
const ACTIVITY_KEY = "stadiumops_client_activity_v1";

interface ClientDataContextValue {
  clientPOs: ClientPO[];
  clientInvoices: ClientInvoice[];
  clientRecords: ClientRecord[];
  mutations: ClientMutation[];
  poEdits: ClientPOEdit[];
  invoiceEdits: ClientInvoiceEdit[];
  clientActivity: ClientActivity[];
  stats: ClientStats;
  applyMutation: (m: ClientMutation) => void;
  applyPOEdit: (edit: ClientPOEdit) => void;
  applyInvoiceEdit: (edit: ClientInvoiceEdit) => void;
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

  useEffect(() => {
    setMutations(loadJson(MUTATIONS_KEY, []));
    setPoEdits(loadJson(PO_EDITS_KEY, []));
    setInvoiceEdits(loadJson(INV_EDITS_KEY, []));
    setClientActivity(loadJson(ACTIVITY_KEY, []));
  }, []);

  const applyMutation = useCallback((m: ClientMutation) => {
    // Find the invoice to compute the correct status
    const invoice = clientInvoices.find((inv) => inv.id === m.invoiceId);
    const computedStatus = invoice
      ? computePaymentStatus(m.paidAmount, invoice.invoiceAmountWithVat, m.paymentStatus)
      : m.paymentStatus;

    const finalMutation: ClientMutation = { ...m, paymentStatus: computedStatus };

    setMutations((prev) => {
      const idx = prev.findIndex((x) => x.invoiceId === m.invoiceId);
      const next = idx >= 0 ? prev.map((x, i) => (i === idx ? finalMutation : x)) : [...prev, finalMutation];
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
    saveJson(MUTATIONS_KEY, []);
    saveJson(PO_EDITS_KEY, []);
    saveJson(INV_EDITS_KEY, []);
    saveJson(ACTIVITY_KEY, []);
  }, []);

  // Apply PO edits
  const resolvedPOs = useMemo<ClientPO[]>(() => {
    return clientPOs.map((po) => {
      const edit = poEdits.find((e) => e.poId === po.id);
      if (!edit) return po;
      return {
        ...po,
        ...(edit.discipline !== undefined && { discipline: edit.discipline }),
        ...(edit.description !== undefined && { description: edit.description }),
        ...(edit.incoTerm !== undefined && { incoTerm: edit.incoTerm }),
        ...(edit.paymentTerm !== undefined && { paymentTerm: edit.paymentTerm }),
        ...(edit.notes !== undefined && { notes: edit.notes }),
      };
    });
  }, [poEdits]);

  // Apply invoice edits + payment mutations
  const resolvedInvoices = useMemo<ClientInvoice[]>(() => {
    return clientInvoices.map((inv) => {
      const edit = invoiceEdits.find((e) => e.invoiceId === inv.id);
      const mut = mutations.find((m) => m.invoiceId === inv.id);

      let result: ClientInvoice = { ...inv };

      if (edit) {
        if (edit.paymentRequestedAmount !== undefined) result = { ...result, paymentRequestedAmount: edit.paymentRequestedAmount };
        if (edit.paymentRequestedDate !== undefined) result = { ...result, paymentRequestedDate: edit.paymentRequestedDate };
        if (edit.notes !== undefined) result = { ...result, notes: edit.notes };
      }

      if (mut) {
        const computedStatus = computePaymentStatus(mut.paidAmount, result.invoiceAmountWithVat, mut.paymentStatus);
        result = {
          ...result,
          paidAmount: mut.paidAmount,
          paymentReceivedDate: mut.paymentReceivedDate,
          paymentStatus: computedStatus,
          notes: mut.notes || result.notes,
        };
      }

      return result;
    });
  }, [mutations, invoiceEdits]);

  const clientRecords = useMemo<ClientRecord[]>(() => {
    return resolvedPOs.map((po) => {
      const invoice = resolvedInvoices.find((inv) => inv.cpoId === po.id)!;
      const pendingAmount = invoice ? Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount) : 0;
      const paid = invoice?.paymentStatus === "Paid 100%";
      return {
        po,
        invoice,
        pendingAmount,
        isOverdue: invoice ? isOverdue(invoice.dueDate) && !paid : false,
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
    const vendorCount = new Set(resolvedPOs.map((po) => po.vendorName)).size;
    const disciplineCount = new Set(resolvedPOs.map((po) => po.discipline)).size;
    const avgCreditDays = Math.round(
      resolvedInvoices.reduce((s, inv) => s + inv.creditDays, 0) / resolvedInvoices.length
    );

    return {
      totalPoValueWithVat, totalInvoiceValueWithVat, totalPaymentRequested,
      totalPaid, totalPending, totalOverdueAmount,
      paidCount, partiallyPaidCount, invoiceSentToHoCount, toBeProcessedCount,
      overdueCount, poCount, invoiceCount, vendorCount, disciplineCount, avgCreditDays,
    };
  }, [resolvedPOs, resolvedInvoices, clientRecords]);

  return (
    <ClientDataContext.Provider value={{
      clientPOs: resolvedPOs,
      clientInvoices: resolvedInvoices,
      clientRecords,
      mutations,
      poEdits,
      invoiceEdits,
      clientActivity,
      stats,
      applyMutation,
      applyPOEdit,
      applyInvoiceEdit,
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
