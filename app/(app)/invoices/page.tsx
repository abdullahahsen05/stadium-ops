"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg, isOverdue, isDueSoon } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Receipt, Search, DollarSign, AlertTriangle, CheckCircle, Clock, Edit2, Eye } from "lucide-react";
import type { ClientInvoice } from "@/lib/client-data/types";

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}>
      {status}
    </span>
  );
}

const STATUS_OPTIONS = ["All", "Paid 100%", "Partially Paid", "Invoice sent to HO", "To be Processed"];

export default function InvoicesPage() {
  const { clientInvoices, clientRecords, stats, applyMutation, applyInvoiceEdit, addClientActivity } = useClientData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail drawer
  const [detailInv, setDetailInv] = useState<ClientInvoice | null>(null);

  // Pay dialog
  const [payDialog, setPayDialog] = useState<ClientInvoice | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Edit invoice dialog
  const [editInv, setEditInv] = useState<ClientInvoice | null>(null);
  const [editPayReqAmt, setEditPayReqAmt] = useState("");
  const [editPayReqDate, setEditPayReqDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const filtered = clientInvoices.filter((inv) => {
    const matchSearch = search === "" ||
      inv.invoiceRef.toLowerCase().includes(search.toLowerCase()) ||
      inv.poRef.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || inv.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  function openPayDialog(inv: ClientInvoice) {
    const pending = Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount);
    setPayDialog(inv);
    setPayAmount(pending.toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef("");
    setPayNotes("");
  }

  function handlePayment() {
    if (!payDialog) return;
    if (!payRef.trim()) { toast.error("Reference number is required"); return; }
    const amount = Number(payAmount);
    if (amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    if (amount > payDialog.invoiceAmountWithVat) { toast.error("Amount cannot exceed invoice value"); return; }

    applyMutation({
      invoiceId: payDialog.id,
      paidAmount: amount,
      paymentReceivedDate: payDate,
      paymentStatus: "Paid 100%",
      referenceNumber: payRef,
      notes: payNotes,
    });
    addClientActivity({
      action: "payment",
      description: `Payment recorded for ${payDialog.invoiceRef} — ${formatSAR(amount)} (ref: ${payRef})`,
      referenceId: payDialog.id,
      referenceRef: payDialog.invoiceRef,
      performedBy: "Ali Khan",
    });
    toast.success(`Payment of ${formatSAR(amount)} recorded for ${payDialog.invoiceRef}`);
    setPayDialog(null);
  }

  function openEditInv(inv: ClientInvoice) {
    setEditInv(inv);
    setEditPayReqAmt(inv.paymentRequestedAmount > 0 ? inv.paymentRequestedAmount.toFixed(2) : "");
    setEditPayReqDate(inv.paymentRequestedDate || "");
    setEditNotes(inv.notes || "");
  }

  function saveInvoiceEdit() {
    if (!editInv) return;
    applyInvoiceEdit({
      invoiceId: editInv.id,
      paymentRequestedAmount: editPayReqAmt ? Number(editPayReqAmt) : undefined,
      paymentRequestedDate: editPayReqDate || undefined,
      notes: editNotes || undefined,
      updatedAt: new Date().toISOString(),
    });
    addClientActivity({
      action: "updated",
      description: `Edited invoice ${editInv.invoiceRef}`,
      referenceId: editInv.id,
      referenceRef: editInv.invoiceRef,
      performedBy: "Ali Khan",
    });
    toast.success(`Invoice ${editInv.invoiceRef} updated`);
    setEditInv(null);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Invoices"
        subtitle="Jeddah Stadium procurement invoices — imported from Excel tracker."
        actions={
          <Button
            className="gap-2 text-white text-[12.5px]"
            style={{ background: "#E07B00" }}
            onClick={() => toast.info("Use the Data Import page to add new invoice records.")}
          >
            <Receipt size={13} />Add Invoice
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} subtext={`${stats.invoiceCount} invoices`} icon={Receipt} variant="info" />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} fully settled`} icon={CheckCircle} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.invoiceCount - stats.paidCount} outstanding`} icon={DollarSign} variant="warning" />
        <StatCard label="Overdue" value={stats.overdueCount > 0 ? formatSAR(stats.totalOverdueAmount) : "None"} subtext={stats.overdueCount > 0 ? `${stats.overdueCount} past due date` : "All within terms"} icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "success"} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search invoice ref, PO ref, vendor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "All")}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} of {clientInvoices.length} invoices</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#F8F9FC] sticky top-0">
                <tr className="border-b border-[#E3E8F0]">
                  {["PO Ref", "Vendor", "Invoice Ref", "Invoice Date", "Amt w/VAT", "Pay Requested", "Req Date", "Paid", "Received", "Credit", "Due Date", "Status", "Pending", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-2.5 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const ov = isOverdue(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                  const soon = isDueSoon(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                  const pending = Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount);
                  return (
                    <tr key={inv.id} className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors ${ov ? "bg-red-50/30" : soon ? "bg-amber-50/20" : ""}`}>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px] text-[#6A788D]">{inv.poRef}</td>
                      <td className="py-2.5 px-2.5 font-medium text-[#14223B] whitespace-nowrap">{inv.vendorName}</td>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px] font-semibold text-[#14223B]">{inv.invoiceRef}</td>
                      <td className="py-2.5 px-2.5 text-[#6A788D] whitespace-nowrap">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px] font-semibold">{formatSAR(inv.invoiceAmountWithVat)}</td>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px]">{inv.paymentRequestedAmount > 0 ? formatSAR(inv.paymentRequestedAmount) : "—"}</td>
                      <td className="py-2.5 px-2.5 text-[#6A788D] whitespace-nowrap">{inv.paymentRequestedDate || "—"}</td>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px] text-[#1E8E55] font-semibold">{inv.paidAmount > 0 ? formatSAR(inv.paidAmount) : "—"}</td>
                      <td className="py-2.5 px-2.5 text-[#6A788D] whitespace-nowrap">{inv.paymentReceivedDate || "—"}</td>
                      <td className="py-2.5 px-2.5 text-[#6A788D] whitespace-nowrap">{inv.creditDays}d</td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={ov ? "text-[#C0453F] font-semibold" : soon ? "text-[#C8901F] font-semibold" : "text-[#6A788D]"}>
                          {inv.dueDate || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5"><PaymentStatusBadge status={inv.paymentStatus} /></td>
                      <td className="py-2.5 px-2.5 font-mono text-[11.5px] font-semibold" style={{ color: pending > 0 ? "#C8901F" : "#1E8E55" }}>
                        {pending > 0 ? formatSAR(pending) : "—"}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailInv(inv)}
                            className="h-7 w-7 flex items-center justify-center rounded text-[#1968D3] hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => openEditInv(inv)}
                            className="h-7 w-7 flex items-center justify-center rounded text-[#6A788D] hover:bg-[#F0F3F8]"
                            title="Edit invoice"
                          >
                            <Edit2 size={12} />
                          </button>
                          {inv.paymentStatus !== "Paid 100%" && (
                            <button
                              onClick={() => openPayDialog(inv)}
                              className="h-7 px-2 flex items-center gap-1 rounded text-[11px] font-semibold text-[#1E8E55] hover:bg-green-50"
                              title="Record payment"
                            >
                              <DollarSign size={11} />Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!detailInv} onOpenChange={() => setDetailInv(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {detailInv && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2">
                  <Receipt size={16} className="text-[#E07B00]" />
                  Invoice Details
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#F8F9FC]">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-3">Invoice Information</div>
                  <div className="space-y-2 text-[12.5px]">
                    {[
                      { label: "Invoice Ref", value: detailInv.invoiceRef },
                      { label: "PO Ref", value: detailInv.poRef },
                      { label: "Vendor", value: detailInv.vendorName },
                      { label: "Invoice Date", value: detailInv.invoiceDate },
                      { label: "Invoice Amt w/VAT", value: formatSAR(detailInv.invoiceAmountWithVat) },
                      { label: "Payment Requested", value: detailInv.paymentRequestedAmount > 0 ? formatSAR(detailInv.paymentRequestedAmount) : "—" },
                      { label: "Payment Req Date", value: detailInv.paymentRequestedDate || "—" },
                      { label: "Paid Amount", value: detailInv.paidAmount > 0 ? formatSAR(detailInv.paidAmount) : "—" },
                      { label: "Pending Amount", value: formatSAR(Math.max(0, detailInv.invoiceAmountWithVat - detailInv.paidAmount)) },
                      { label: "Payment Received", value: detailInv.paymentReceivedDate || "—" },
                      { label: "Credit Days", value: `${detailInv.creditDays} days` },
                      { label: "Due Date", value: detailInv.dueDate || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[#6A788D]">{label}</span>
                        <span className="font-semibold text-[#14223B]">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-2">
                      <span className="text-[#6A788D]">Payment Status</span>
                      <PaymentStatusBadge status={detailInv.paymentStatus} />
                    </div>
                  </div>
                </div>
                {detailInv.notes && (
                  <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#FFFBEB]">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-1">Notes</div>
                    <p className="text-[12.5px] text-[#14223B]">{detailInv.notes}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openEditInv(detailInv)}>
                    <Edit2 size={13} className="mr-1.5" />Edit Invoice
                  </Button>
                  {detailInv.paymentStatus !== "Paid 100%" && (
                    <Button className="flex-1 text-white" style={{ background: "#1E8E55" }} onClick={() => openPayDialog(detailInv)}>
                      <DollarSign size={13} className="mr-1.5" />Record Payment
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Pay Dialog */}
      {payDialog && (
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Record Payment — {payDialog.invoiceRef}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px] space-y-1">
                <div className="flex justify-between"><span className="text-[#6A788D]">Invoice Amount:</span><span className="font-semibold">{formatSAR(payDialog.invoiceAmountWithVat)}</span></div>
                <div className="flex justify-between"><span className="text-[#6A788D]">Already Paid:</span><span className="font-semibold text-[#1E8E55]">{payDialog.paidAmount > 0 ? formatSAR(payDialog.paidAmount) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-[#6A788D]">Outstanding:</span><span className="font-bold text-[#C8901F]">{formatSAR(Math.max(0, payDialog.invoiceAmountWithVat - payDialog.paidAmount))}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Payment Date</Label>
                  <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Amount (SAR)</Label>
                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} step="0.01" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Reference Number *</Label>
                <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN / Transfer ref..." />
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              <div className="text-[12px] text-[#6A788D] bg-[#F8F9FC] rounded-lg p-2.5">
                If paid amount &lt; invoice value, status will be set to <strong>Partially Paid</strong>. Full payment sets <strong>Paid 100%</strong>.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button className="flex-1 text-white" style={{ background: "#1E8E55" }} onClick={handlePayment}>Record Payment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Invoice Dialog */}
      {editInv && (
        <Dialog open={!!editInv} onOpenChange={() => setEditInv(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Invoice — {editInv.invoiceRef}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Payment Requested (SAR)</Label>
                  <Input type="number" value={editPayReqAmt} onChange={(e) => setEditPayReqAmt(e.target.value)} step="0.01" placeholder="0.00" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Payment Requested Date</Label>
                  <Input type="date" value={editPayReqDate} onChange={(e) => setEditPayReqDate(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditInv(null)}>Cancel</Button>
                <Button className="flex-1 text-white" style={{ background: "#E07B00" }} onClick={saveInvoiceEdit}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
