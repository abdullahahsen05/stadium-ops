export interface ClientPO {
  id: string;
  discipline: string;
  poRef: string;
  vendorName: string;
  initiatedBy: string;
  dateIssued: string;
  description: string;
  quantity: string;
  currency: string;
  xeConversion: number;
  poAmount: number;
  amountWithoutVatSar: number;
  amountWithVatSar: number;
  incoTerm: string;
  paymentTerm: string;
  notes?: string;
}

export interface ClientInvoice {
  id: string;
  sl: number;
  poRef: string;
  cpoId: string;
  vendorName: string;
  poAmount: number;
  poAmountWithVat: number;
  invoiceAmountWithVat: number;
  invoiceRef: string;
  invoiceDate: string;
  paymentRequestedAmount: number;
  paymentRequestedDate: string;
  paidAmount: number;
  paymentReceivedDate: string;
  paymentStatus: string; // "Paid 100%" | "Partially Paid" | "Invoice sent to HO" | "To be Processed"
  creditDays: number;
  dueDate: string;
  notes?: string;
}

export interface ClientRecord {
  po: ClientPO;
  invoice: ClientInvoice;
  pendingAmount: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export interface ClientMutation {
  invoiceId: string;
  paidAmount: number;
  paymentReceivedDate: string;
  paymentStatus: string;
  referenceNumber: string;
  notes: string;
}

export interface ClientPOEdit {
  poId: string;
  discipline?: string;
  description?: string;
  incoTerm?: string;
  paymentTerm?: string;
  notes?: string;
  updatedAt: string;
}

export interface ClientInvoiceEdit {
  invoiceId: string;
  paymentRequestedAmount?: number;
  paymentRequestedDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface ClientActivity {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  referenceId?: string;
  referenceRef?: string;
  performedBy: string;
}

export interface ClientStats {
  totalPoValueWithVat: number;
  totalInvoiceValueWithVat: number;
  totalPaymentRequested: number;
  totalPaid: number;
  totalPending: number;
  totalOverdueAmount: number;
  paidCount: number;
  partiallyPaidCount: number;
  invoiceSentToHoCount: number;
  toBeProcessedCount: number;
  overdueCount: number;
  poCount: number;
  invoiceCount: number;
  vendorCount: number;
  disciplineCount: number;
  avgCreditDays: number;
}
