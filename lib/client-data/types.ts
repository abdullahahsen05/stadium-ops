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
  paymentStatus: string;
  creditDays: number;
  dueDate: string;
  notes?: string;
}

export interface ClientVendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface ClientRecord {
  po: ClientPO;
  invoice?: ClientInvoice;
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
  vendorName?: string;
  initiatedBy?: string;
  dateIssued?: string;
  description?: string;
  quantity?: string;
  currency?: string;
  poAmount?: number;
  amountWithoutVatSar?: number;
  amountWithVatSar?: number;
  incoTerm?: string;
  paymentTerm?: string;
  notes?: string;
  updatedAt: string;
}

export interface ClientInvoiceEdit {
  invoiceId: string;
  invoiceRef?: string;
  invoiceDate?: string;
  invoiceAmountWithVat?: number;
  paymentRequestedAmount?: number;
  paymentRequestedDate?: string;
  creditDays?: number;
  dueDate?: string;
  paymentStatus?: string;
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

export interface ClientAlert {
  id: string;
  type: "overdue" | "due_soon" | "sent_to_ho" | "to_be_processed" | "po_no_invoice";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  vendorName?: string;
  poRef?: string;
  invoiceRef?: string;
  amount?: number;
  dueDate?: string;
  daysOverdue?: number;
  daysRemaining?: number;
  relatedPoId?: string;
  relatedInvoiceId?: string;
}

export type AlertStateMap = Record<string, "open" | "acknowledged" | "resolved">;

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
