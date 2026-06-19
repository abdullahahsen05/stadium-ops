import type { ClientInvoice, ClientMutation } from "./types";

const PAYMENT_EPSILON = 0.01;

export function formatSAR(amount: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function isDueSoon(dueDate: string, days = 14): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function computePaymentStatus(paidAmount: number, invoiceAmountWithVat: number, fallback: string): string {
  if (paidAmount >= invoiceAmountWithVat && invoiceAmountWithVat > 0) return "Paid 100%";
  if (paidAmount > 0) return "Partially Paid";
  return fallback;
}

export function getInvoicePendingAmount(
  invoice: Pick<ClientInvoice, "invoiceAmountWithVat" | "paidAmount">,
): number {
  return Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount);
}

export function buildPaymentMutation(
  invoice: Pick<ClientInvoice, "id" | "invoiceAmountWithVat" | "paidAmount" | "paymentStatus">,
  payment: {
    amount: number;
    paymentDate: string;
    referenceNumber: string;
    notes: string;
  },
): ClientMutation {
  const pending = getInvoicePendingAmount(invoice);

  if (payment.amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  if (payment.amount > pending + PAYMENT_EPSILON) {
    throw new Error("Payment amount cannot exceed pending amount");
  }

  const paidAmount = payment.amount >= pending - PAYMENT_EPSILON
    ? invoice.invoiceAmountWithVat
    : invoice.paidAmount + payment.amount;

  return {
    invoiceId: invoice.id,
    paidAmount,
    paymentReceivedDate: payment.paymentDate,
    paymentStatus: computePaymentStatus(paidAmount, invoice.invoiceAmountWithVat, invoice.paymentStatus),
    referenceNumber: payment.referenceNumber,
    notes: payment.notes,
  };
}

export function getPOPaymentState(
  invoice:
    | Pick<ClientInvoice, "invoiceAmountWithVat" | "paidAmount" | "paymentStatus" | "dueDate">
    | undefined,
) {
  if (!invoice) {
    return {
      label: "No Invoice Yet",
      status: "No Invoice Yet",
      pendingAmount: 0,
      paidAmount: 0,
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const pendingAmount = getInvoicePendingAmount(invoice);
  const fullyPaid = invoice.paymentStatus === "Paid 100%" || pendingAmount <= 0;
  const overdue = !fullyPaid && isOverdue(invoice.dueDate);
  const dueSoon = !fullyPaid && !overdue && isDueSoon(invoice.dueDate);

  return {
    label: overdue ? "Overdue" : invoice.paymentStatus || "Invoice Received",
    status: invoice.paymentStatus || "Invoice Received",
    pendingAmount,
    paidAmount: invoice.paidAmount,
    isOverdue: overdue,
    isDueSoon: dueSoon,
  };
}

export function getPaymentStatusColor(status: string): string {
  if (status === "Overdue") return "#C0453F";
  if (status === "Paid 100%") return "#1E8E55";
  if (status === "Partially Paid") return "#7C3AED";
  if (status === "Invoice sent to HO") return "#1968D3";
  if (status === "To be Processed") return "#C8901F";
  if (status === "No Invoice Yet") return "#6A788D";
  return "#6A788D";
}

export function getPaymentStatusBg(status: string): string {
  if (status === "Overdue") return "#FEF2F2";
  if (status === "Paid 100%") return "#ECFDF5";
  if (status === "Partially Paid") return "#F5F3FF";
  if (status === "Invoice sent to HO") return "#EFF6FF";
  if (status === "To be Processed") return "#FFFBEB";
  if (status === "No Invoice Yet") return "#F8F9FC";
  return "#F8F9FC";
}
