import type { Payment } from "@/lib/types";

export const mockPayments: Payment[] = [
  {
    id: "pay-001", paymentNumber: "PAY-2026-001",
    invoiceId: "inv-001", invoiceNumber: "INV-2026-001",
    vendorId: "v-001", vendorName: "National Cement Suppliers",
    paymentDate: "2026-06-01", amount: 3220000,
    method: "Bank Transfer", referenceNumber: "TXN-HBL-20260601-001",
    notes: "Full payment cleared",
  },
  {
    id: "pay-002", paymentNumber: "PAY-2026-002",
    invoiceId: "inv-003", invoiceNumber: "INV-2026-003",
    vendorId: "v-003", vendorName: "BuildPro Electricals",
    paymentDate: "2026-06-10", amount: 1282250,
    method: "Bank Transfer", referenceNumber: "TXN-UBL-20260610-002",
    notes: "Electrical supplies full payment",
  },
  {
    id: "pay-003", paymentNumber: "PAY-2026-003",
    invoiceId: "inv-002", invoiceNumber: "INV-2026-002",
    vendorId: "v-002", vendorName: "Metro Steel Works",
    paymentDate: "2026-06-12", amount: 15000000,
    method: "Cheque", referenceNumber: "CHQ-0004521",
    notes: "Partial payment — remaining pending approval",
  },
];
