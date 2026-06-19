import assert from "node:assert/strict";
import {
  buildPaymentMutation,
  getInvoicePendingAmount,
} from "../lib/client-data/utils.ts";

const invoice = {
  id: "cinv-test",
  invoiceRef: "INV-TEST",
  invoiceAmountWithVat: 1000,
  paidAmount: 250,
  paymentStatus: "Partially Paid",
};

assert.equal(getInvoicePendingAmount(invoice), 750);

const partial = buildPaymentMutation(invoice, {
  amount: 300,
  paymentDate: "2026-06-20",
  referenceNumber: "TXN-1",
  notes: "first follow-up",
});

assert.deepEqual(partial, {
  invoiceId: "cinv-test",
  paidAmount: 550,
  paymentReceivedDate: "2026-06-20",
  paymentStatus: "Partially Paid",
  referenceNumber: "TXN-1",
  notes: "first follow-up",
});

const full = buildPaymentMutation(invoice, {
  amount: 750,
  paymentDate: "2026-06-21",
  referenceNumber: "TXN-2",
  notes: "",
});

assert.equal(full.paidAmount, 1000);
assert.equal(full.paymentStatus, "Paid 100%");

assert.throws(
  () => buildPaymentMutation(invoice, {
    amount: 751,
    paymentDate: "2026-06-22",
    referenceNumber: "TXN-3",
    notes: "",
  }),
  /cannot exceed pending amount/i,
);

assert.throws(
  () => buildPaymentMutation(invoice, {
    amount: -1,
    paymentDate: "2026-06-22",
    referenceNumber: "TXN-4",
    notes: "",
  }),
  /greater than 0/i,
);

console.log("payment logic ok");
