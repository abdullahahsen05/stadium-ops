"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg, isOverdue } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, Search, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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

export default function PaymentsPage() {
  const { clientInvoices, stats, applyMutation, addClientActivity } = useClientData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pay dialog
  const [payDialog, setPayDialog] = useState<ClientInvoice | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

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

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Payments"
        subtitle="Track payment records for Jeddah Stadium procurement invoices."
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} invoices`} icon={CheckCircle} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.invoiceCount - stats.paidCount} invoices`} icon={Clock} variant="warning" />
        <StatCard label="Overdue Amount" value={stats.totalOverdueAmount > 0 ? formatSAR(stats.totalOverdueAmount) : "None"} subtext={stats.overdueCount > 0 ? `${stats.overdueCount} invoices` : "All within terms"} icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "success"} />
        <StatCard label="Invoice sent to HO" value={String(stats.invoiceSentToHoCount)} subtext="Awaiting HO release" icon={DollarSign} variant="info" />
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
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} of {clientInvoices.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#F8F9FC] sticky top-0">
                <tr className="border-b border-[#E3E8F0]">
                  {["Vendor", "PO Ref", "Invoice Ref", "Invoice Date", "Invoice Amt w/VAT", "Payment Requested", "Paid Amount", "Received Date", "Pending", "Due Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-3 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const ov = isOverdue(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                  const pending = Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount);
                  return (
                    <tr key={inv.id} className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors ${ov ? "bg-red-50/30" : ""}`}>
                      <td className="py-3 px-3 font-medium text-[#14223B]">{inv.vendorName}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px] text-[#6A788D]">{inv.poRef}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px] font-semibold text-[#14223B]">{inv.invoiceRef}</td>
                      <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{inv.invoiceDate}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px] font-semibold">{formatSAR(inv.invoiceAmountWithVat)}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px]">{inv.paymentRequestedAmount > 0 ? formatSAR(inv.paymentRequestedAmount) : "—"}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px] text-[#1E8E55] font-semibold">{inv.paidAmount > 0 ? formatSAR(inv.paidAmount) : "—"}</td>
                      <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{inv.paymentReceivedDate || "—"}</td>
                      <td className="py-3 px-3 font-mono text-[11.5px] font-semibold" style={{ color: pending > 0 ? "#C8901F" : "#1E8E55" }}>
                        {pending > 0 ? formatSAR(pending) : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span className={ov ? "text-[#C0453F] font-semibold" : "text-[#6A788D]"}>{inv.dueDate || "—"}</span>
                      </td>
                      <td className="py-3 px-3"><PaymentStatusBadge status={inv.paymentStatus} /></td>
                      <td className="py-3 px-3">
                        {inv.paymentStatus !== "Paid 100%" && (
                          <Button
                            size="sm"
                            className="h-7 px-3 gap-1 text-white text-[11px]"
                            style={{ background: "#1E8E55" }}
                            onClick={() => openPayDialog(inv)}
                          >
                            <DollarSign size={11} />Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Dialog */}
      {payDialog && (
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Record Payment — {payDialog.invoiceRef}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px] space-y-1">
                <div className="flex justify-between"><span className="text-[#6A788D]">Vendor:</span><span className="font-semibold">{payDialog.vendorName}</span></div>
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
                <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN / Bank transfer ref..." />
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              <div className="text-[11.5px] text-[#6A788D] bg-[#F8F9FC] rounded-lg p-2.5">
                Partial amount → <strong>Partially Paid</strong>. Full amount → <strong>Paid 100%</strong>.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button className="flex-1 text-white" style={{ background: "#1E8E55" }} onClick={handlePayment}>Record Payment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
