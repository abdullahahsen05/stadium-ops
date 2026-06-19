"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { clientPOs, clientInvoices } from "./data";
import { isOverdue, isDueSoon } from "./utils";
import type { ClientPO, ClientInvoice, ClientRecord, ClientMutation, ClientStats } from "./types";

const MUTATIONS_KEY = "stadiumops_client_mutations_v1";

interface ClientDataContextValue {
  clientPOs: ClientPO[];
  clientInvoices: ClientInvoice[];
  clientRecords: ClientRecord[];
  mutations: ClientMutation[];
  stats: ClientStats;
  applyMutation: (m: ClientMutation) => void;
}

const ClientDataContext = createContext<ClientDataContextValue | null>(null);

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const [mutations, setMutations] = useState<ClientMutation[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUTATIONS_KEY);
      if (stored) {
        setMutations(JSON.parse(stored) as ClientMutation[]);
      }
    } catch {
      // ignore
    }
  }, []);

  const applyMutation = useCallback((m: ClientMutation) => {
    setMutations((prev) => {
      // Replace existing mutation for the same invoice, or add new
      const idx = prev.findIndex((x) => x.invoiceId === m.invoiceId);
      const next = idx >= 0 ? prev.map((x, i) => (i === idx ? m : x)) : [...prev, m];
      try {
        localStorage.setItem(MUTATIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Apply mutations on top of base invoice data
  const resolvedInvoices = useMemo<ClientInvoice[]>(() => {
    return clientInvoices.map((inv) => {
      const mut = mutations.find((m) => m.invoiceId === inv.id);
      if (!mut) return inv;
      return {
        ...inv,
        paidAmount: mut.paidAmount,
        paymentReceivedDate: mut.paymentReceivedDate,
        paymentStatus: mut.paymentStatus,
      };
    });
  }, [mutations]);

  // Merged PO+Invoice records
  const clientRecords = useMemo<ClientRecord[]>(() => {
    return clientPOs.map((po) => {
      const invoice = resolvedInvoices.find((inv) => inv.cpoId === po.id)!;
      const pendingAmount = invoice ? invoice.invoiceAmountWithVat - invoice.paidAmount : 0;
      return {
        po,
        invoice,
        pendingAmount,
        isOverdue: invoice ? isOverdue(invoice.dueDate) && invoice.paymentStatus !== "Paid 100%" : false,
        isDueSoon: invoice ? isDueSoon(invoice.dueDate) && invoice.paymentStatus !== "Paid 100%" : false,
      };
    });
  }, [resolvedInvoices]);

  const stats = useMemo<ClientStats>(() => {
    const totalPoValueWithVat = clientPOs.reduce((s, po) => s + po.amountWithVatSar, 0);
    const totalInvoiceValueWithVat = resolvedInvoices.reduce((s, inv) => s + inv.invoiceAmountWithVat, 0);
    const totalPaymentRequested = resolvedInvoices.reduce((s, inv) => s + inv.paymentRequestedAmount, 0);
    const totalPaid = resolvedInvoices.reduce((s, inv) => s + inv.paidAmount, 0);
    const totalPending = resolvedInvoices.reduce((s, inv) => s + (inv.invoiceAmountWithVat - inv.paidAmount), 0);
    const paidCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "Paid 100%").length;
    const invoiceSentToHoCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "Invoice sent to HO").length;
    const toBeProcessedCount = resolvedInvoices.filter((inv) => inv.paymentStatus === "To be Processed").length;
    const overdueCount = clientRecords.filter((r) => r.isOverdue).length;
    const poCount = clientPOs.length;
    const vendorCount = new Set(clientPOs.map((po) => po.vendorName)).size;
    const disciplineCount = new Set(clientPOs.map((po) => po.discipline)).size;
    const avgCreditDays = Math.round(
      resolvedInvoices.reduce((s, inv) => s + inv.creditDays, 0) / resolvedInvoices.length
    );

    return {
      totalPoValueWithVat,
      totalInvoiceValueWithVat,
      totalPaymentRequested,
      totalPaid,
      totalPending,
      paidCount,
      invoiceSentToHoCount,
      toBeProcessedCount,
      overdueCount,
      poCount,
      vendorCount,
      disciplineCount,
      avgCreditDays,
    };
  }, [resolvedInvoices, clientRecords]);

  return (
    <ClientDataContext.Provider value={{ clientPOs, clientInvoices: resolvedInvoices, clientRecords, mutations, stats, applyMutation }}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  const ctx = useContext(ClientDataContext);
  if (!ctx) throw new Error("useClientData must be used within ClientDataProvider");
  return ctx;
}
