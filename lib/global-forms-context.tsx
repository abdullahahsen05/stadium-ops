"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ClientPO, ClientInvoice } from "@/lib/client-data/types";

export type GlobalFormType = "addInvoice" | "editInvoice" | "addPO" | "editPO" | "recordPayment" | "addVendor" | null;

export interface GlobalFormPrefill {
  po?: ClientPO;
  invoice?: ClientInvoice;
  vendorName?: string;
}

interface GlobalFormsContextValue {
  activeForm: GlobalFormType;
  prefill: GlobalFormPrefill;
  openForm: (form: GlobalFormType, prefill?: GlobalFormPrefill) => void;
  closeForm: () => void;
}

const GlobalFormsContext = createContext<GlobalFormsContextValue | null>(null);

export function GlobalFormsProvider({ children }: { children: React.ReactNode }) {
  const [activeForm, setActiveForm] = useState<GlobalFormType>(null);
  const [prefill, setPrefill] = useState<GlobalFormPrefill>({});

  const openForm = useCallback((form: GlobalFormType, p: GlobalFormPrefill = {}) => {
    setActiveForm(form);
    setPrefill(p);
  }, []);

  const closeForm = useCallback(() => {
    setActiveForm(null);
    setPrefill({});
  }, []);

  return (
    <GlobalFormsContext.Provider value={{ activeForm, prefill, openForm, closeForm }}>
      {children}
    </GlobalFormsContext.Provider>
  );
}

export function useGlobalForms() {
  const ctx = useContext(GlobalFormsContext);
  if (!ctx) throw new Error("useGlobalForms must be used within GlobalFormsProvider");
  return ctx;
}
