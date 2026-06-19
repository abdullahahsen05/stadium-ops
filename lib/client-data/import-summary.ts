export const importSummary = {
  importDate: "2026-06-19",
  files: [
    { name: "Purchase Track- Excel.xlsx", sheet: "Sheet1", rowsProcessed: 18, type: "purchase_orders" },
    { name: "Invoice Track- Excel.xlsx", sheet: "Sheet1", rowsProcessed: 18, type: "invoices" },
  ],
  purchaseOrdersDetected: 18,
  invoicesDetected: 18,
  vendorsDetected: 1,
  linkedMatches: 18,
  unmatchedPOs: 0,
  unmatchedInvoices: 0,
  missingDates: 4, // 4 invoices with no paymentRequestedDate
  recordsPending: 10, // "Invoice sent to HO" (6) + "To be Processed" (4)
};
