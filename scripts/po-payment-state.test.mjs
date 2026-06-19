import assert from "node:assert/strict";
import { getPOPaymentState } from "../lib/client-data/utils.ts";

const future = "2099-01-01";
const past = "2020-01-01";

assert.deepEqual(getPOPaymentState(undefined), {
  label: "No Invoice Yet",
  status: "No Invoice Yet",
  pendingAmount: 0,
  paidAmount: 0,
  isOverdue: false,
  isDueSoon: false,
});

assert.deepEqual(getPOPaymentState({
  invoiceAmountWithVat: 1000,
  paidAmount: 1000,
  paymentStatus: "Paid 100%",
  dueDate: past,
}), {
  label: "Paid 100%",
  status: "Paid 100%",
  pendingAmount: 0,
  paidAmount: 1000,
  isOverdue: false,
  isDueSoon: false,
});

assert.equal(getPOPaymentState({
  invoiceAmountWithVat: 1000,
  paidAmount: 400,
  paymentStatus: "Partially Paid",
  dueDate: future,
}).label, "Partially Paid");

assert.equal(getPOPaymentState({
  invoiceAmountWithVat: 1000,
  paidAmount: 0,
  paymentStatus: "Invoice sent to HO",
  dueDate: past,
}).label, "Overdue");

console.log("po payment state ok");
