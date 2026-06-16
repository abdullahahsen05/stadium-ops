import { mockAlerts, mockInvoices } from "@/lib/mock";

export const demoOpenAlerts = mockAlerts.filter((alert) => alert.status === "Open").length;

export const demoOpenInvoices = mockInvoices.filter(
  (invoice) => invoice.status === "Pending" || invoice.status === "Overdue"
).length;
