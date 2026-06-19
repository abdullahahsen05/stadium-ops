"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import {
  buildPaymentMutation,
  formatSAR,
  getInvoicePendingAmount,
  getPaymentStatusColor,
  getPaymentStatusBg,
  isOverdue,
  isDueSoon,
} from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Receipt, Search, DollarSign, AlertTriangle, CheckCircle,
  Edit2, Plus, Trash2, MoreHorizontal, LayoutList, AlignJustify,
  FileText,
} from "lucide-react";
import type { ClientInvoice } from "@/lib/client-data/types";

/* ─── helpers ─── */

function fmtDate(d: string | undefined) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}
    >
      {status}
    </span>
  );
}

const STATUS_OPTIONS = ["All", "Paid 100%", "Partially Paid", "Invoice sent to HO", "To be Processed"];

/* ─── page ─── */

export default function InvoicesPage() {
  const { clientInvoices, clientPOs, stats, applyMutation, addClientActivity, deleteClientInvoice } = useClientData();
  const { openForm } = useGlobalForms();

  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [density, setDensity]             = useState<"compact" | "detailed">("compact");
  const [detailInv, setDetailInv]         = useState<ClientInvoice | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<ClientInvoice | null>(null);
  const [payDialog, setPayDialog]         = useState<ClientInvoice | null>(null);
  const [payDate, setPayDate]             = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount]         = useState("");
  const [payRef, setPayRef]               = useState("");
  const [payNotes, setPayNotes]           = useState("");

  const filtered = clientInvoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || inv.invoiceRef.toLowerCase().includes(q)
      || inv.poRef.toLowerCase().includes(q)
      || inv.vendorName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || inv.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  function openPayDialog(inv: ClientInvoice) {
    setPayDialog(inv);
    setPayAmount(getInvoicePendingAmount(inv).toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef(""); setPayNotes("");
  }

  function handlePayment() {
    if (!payDialog) return;
    if (!payRef.trim()) { toast.error("Reference number is required"); return; }
    const amount = Number(payAmount);
    let mutation;
    try {
      mutation = buildPaymentMutation(payDialog, {
        amount,
        paymentDate: payDate,
        referenceNumber: payRef.trim(),
        notes: payNotes.trim(),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record payment");
      return;
    }
    applyMutation(mutation);
    addClientActivity({
      action: "payment",
      description: `Payment ${formatSAR(amount)} for ${payDialog.invoiceRef} (ref: ${payRef.trim()})`,
      referenceId: payDialog.id,
      referenceRef: payDialog.invoiceRef,
      performedBy: "Ali Khan",
    });
    toast.success(`Payment of ${formatSAR(amount)} recorded`);
    setPayDialog(null);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Invoices"
        subtitle="Jeddah Stadium procurement invoices — imported from Excel tracker."
        actions={
          <Button className="gap-2 text-white text-[12.5px]" style={{ background: "#E07B00" }}
            onClick={() => openForm("addInvoice")}>
            <Plus size={13} />Add Invoice
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} subtext={`${stats.invoiceCount} invoices`} icon={Receipt} variant="info" />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} fully settled`} icon={CheckCircle} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.invoiceCount - stats.paidCount} outstanding`} icon={DollarSign} variant="warning" />
        <StatCard label="Overdue" value={stats.overdueCount > 0 ? formatSAR(stats.totalOverdueAmount) : "None"} subtext={stats.overdueCount > 0 ? `${stats.overdueCount} past due` : "All within terms"} icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "success"} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search invoice, PO, vendor…" className="pl-9 h-9 text-[13px]" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "All")}>
          <SelectTrigger className="w-48 h-9 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12.5px] text-[#9AA6B6]">{filtered.length} of {clientInvoices.length}</span>
          <div className="flex items-center rounded-lg border border-[#E3E8F0] bg-white overflow-hidden">
            {(["compact", "detailed"] as const).map((d, i) => (
              <div key={d} className="flex items-center">
                {i > 0 && <div className="w-px h-5 bg-[#E3E8F0]" />}
                <button
                  onClick={() => setDensity(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors ${density === d ? "bg-[#F5F7FB] text-[#14223B]" : "text-[#9AA6B6] hover:text-[#6A788D]"}`}
                >
                  {d === "compact" ? <LayoutList size={13} /> : <AlignJustify size={13} />}
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? <EmptyState icon={Receipt} title="No invoices found" /> : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#F8F9FC]">
                {[
                  "Invoice Ref", "Vendor", "PO Ref",
                  ...(density === "detailed" ? ["Invoice Date", "Req Date"] : []),
                  "Payment Summary", "Due Date", "Status", "",
                ].map((h) => (
                  <th
                    key={h}
                    className={`text-left py-3 px-4 text-[11px] font-semibold text-[#6A788D] uppercase tracking-wide whitespace-nowrap ${
                      h === "Vendor" ? "w-[18%]" :
                      h === "Payment Summary" ? "w-[23%]" :
                      h === "Status" ? "w-[13%]" :
                      h === "" ? "w-[110px]" :
                      ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const pending = getInvoicePendingAmount(inv);
                const ov = isOverdue(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                const soon = !ov && isDueSoon(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                return (
                  <tr key={inv.id}
                    onClick={() => setDetailInv(inv)}
                    className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] cursor-pointer transition-colors group ${ov ? "bg-red-50/20" : soon ? "bg-amber-50/10" : ""}`}
                  >
                    {/* Invoice Ref */}
                    <td className="py-3.5 px-4 truncate">
                      <span className="font-mono font-semibold text-[12.5px] text-[#14223B]">{inv.invoiceRef}</span>
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <span className="block font-medium text-[12.5px] text-[#14223B] truncate" title={inv.vendorName}>{inv.vendorName}</span>
                    </td>

                    {/* PO Ref */}
                    <td className="py-3.5 px-4 max-w-[140px]">
                      <span className="font-mono text-[11.5px] text-[#6A788D] truncate block" title={inv.poRef}>{inv.poRef || "—"}</span>
                    </td>

                    {/* Detailed extras */}
                    {density === "detailed" && <>
                      <td className="py-3.5 px-4 text-[12px] text-[#6A788D] whitespace-nowrap">{fmtDate(inv.invoiceDate)}</td>
                      <td className="py-3.5 px-4 text-[12px] text-[#6A788D] whitespace-nowrap">{fmtDate(inv.paymentRequestedDate)}</td>
                    </>}

                    {/* Payment Summary */}
                    <td className="py-3.5 px-4 min-w-0">
                      <div className="space-y-[3px] text-[11.5px] leading-tight">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[#9AA6B6] w-[42px] shrink-0 text-[10.5px]">Invoice</span>
                          <span className="font-mono font-semibold text-[#14223B] truncate">{formatSAR(inv.invoiceAmountWithVat)}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[#9AA6B6] w-[42px] shrink-0 text-[10.5px]">Paid</span>
                          <span className={`font-mono font-semibold truncate ${inv.paidAmount > 0 ? "text-[#1E8E55]" : "text-[#C8B9A0]"}`}>
                            {inv.paidAmount > 0 ? formatSAR(inv.paidAmount) : "—"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[#9AA6B6] w-[42px] shrink-0 text-[10.5px]">Pending</span>
                          <span className={`font-mono font-semibold truncate ${pending > 0 ? "text-[#C8901F]" : "text-[#C8B9A0]"}`}>
                            {pending > 0 ? formatSAR(pending) : "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className={`text-[12px] font-medium ${ov ? "text-[#C0453F]" : soon ? "text-[#C8901F]" : "text-[#6A788D]"}`}>
                        {fmtDate(inv.dueDate)}
                      </div>
                      {ov && <div className="text-[10px] font-bold text-[#C0453F] mt-0.5 tracking-wide">OVERDUE</div>}
                      {soon && <div className="text-[10px] font-bold text-[#C8901F] mt-0.5 tracking-wide">DUE SOON</div>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4"><StatusBadge status={inv.paymentStatus} /></td>

                    {/* Actions — stopPropagation so row click doesn't fire */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end">
                        {inv.paymentStatus !== "Paid 100%" && (
                          <Button size="sm"
                            className="h-7 px-2.5 gap-1 text-[11px] font-semibold text-white"
                            style={{ background: "#1E8E55" }}
                            onClick={() => openPayDialog(inv)}
                          >
                            <DollarSign size={11} />Pay
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded text-[#9AA6B6] hover:text-[#6A788D] hover:bg-[#F0F3F8] transition-colors">
                            <MoreHorizontal size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setDetailInv(inv)}>
                              <FileText size={13} className="mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openForm("editInvoice", { invoice: inv })}>
                              <Edit2 size={13} className="mr-2" />Edit Invoice
                            </DropdownMenuItem>
                            {inv.paymentStatus !== "Paid 100%" && (
                              <DropdownMenuItem onClick={() => openPayDialog(inv)}>
                                <DollarSign size={13} className="mr-2" />Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[#C0453F] focus:text-[#C0453F] focus:bg-red-50"
                              onClick={() => setDeleteTarget(inv)}
                            >
                              <Trash2 size={13} className="mr-2" />Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Invoice</DialogTitle></DialogHeader>
          <p className="text-[13px] text-[#6A788D] mt-1">
            Delete <strong className="text-[#14223B] font-mono">{deleteTarget?.invoiceRef}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 h-9" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="flex-1 h-9 text-white" style={{ background: "#C0453F" }}
              onClick={() => {
                if (!deleteTarget) return;
                deleteClientInvoice(deleteTarget.id);
                addClientActivity({ action: "delete_invoice", description: `Deleted invoice ${deleteTarget.invoiceRef}`, referenceId: deleteTarget.id, referenceRef: deleteTarget.invoiceRef, performedBy: "Ali Khan" });
                toast.success(`Invoice ${deleteTarget.invoiceRef} deleted`);
                if (detailInv?.id === deleteTarget.id) setDetailInv(null);
                setDeleteTarget(null);
              }}
            >
              <Trash2 size={13} className="mr-1.5" />Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Detail Drawer ── */}
      <Sheet open={!!detailInv} onOpenChange={(v) => { if (!v) setDetailInv(null); }}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col overflow-hidden">
          {detailInv && (() => {
            const pending = getInvoicePendingAmount(detailInv);
            const ov = isOverdue(detailInv.dueDate) && detailInv.paymentStatus !== "Paid 100%";
            const relatedPO = clientPOs.find((po) => po.id === detailInv.cpoId);
            return (
              <>
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-[#E3E8F0] shrink-0">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6] mb-1">Invoice</div>
                      <div className="font-mono font-bold text-[17px] text-[#14223B] leading-tight">{detailInv.invoiceRef}</div>
                      <div className="text-[13px] text-[#6A788D] mt-1 leading-snug">{detailInv.vendorName}</div>
                    </div>
                    <StatusBadge status={detailInv.paymentStatus} />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Invoice", value: formatSAR(detailInv.invoiceAmountWithVat), color: "#14223B" },
                      { label: "Paid", value: detailInv.paidAmount > 0 ? formatSAR(detailInv.paidAmount) : "—", color: "#1E8E55" },
                      { label: "Pending", value: pending > 0 ? formatSAR(pending) : "—", color: pending > 0 ? "#C8901F" : "#9AA6B6" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#F8F9FC] rounded-xl border border-[#E3E8F0] p-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6] mb-1.5">{label}</div>
                        <div className="font-mono font-bold text-[12.5px]" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Invoice details */}
                  <section>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6] mb-3">Invoice Details</div>
                    <div className="space-y-2.5 text-[12.5px]">
                      {[
                        { label: "Vendor", value: detailInv.vendorName },
                        { label: "PO Reference", value: detailInv.poRef || "—", mono: true },
                        { label: "Invoice Reference", value: detailInv.invoiceRef, mono: true },
                        { label: "Invoice Date", value: fmtDate(detailInv.invoiceDate) },
                        { label: "Invoice Amount With VAT", value: formatSAR(detailInv.invoiceAmountWithVat), mono: true },
                        { label: "Credit Days", value: `${detailInv.creditDays ?? 60} days` },
                        { label: "Due Date", value: fmtDate(detailInv.dueDate), warn: ov },
                        { label: "Payment Status", value: detailInv.paymentStatus },
                      ].map(({ label, value, mono, warn }) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-[#6A788D] shrink-0">{label}</span>
                          <span className={`text-right font-medium ${warn ? "text-[#C0453F] font-semibold" : "text-[#14223B]"} ${mono ? "font-mono" : ""}`}>{value}</span>
                        </div>
                      ))}
                      {detailInv.notes && (
                        <div className="pt-1">
                          <div className="text-[#6A788D] mb-1">Notes</div>
                          <p className="text-[#14223B] bg-[#F8F9FC] rounded-lg px-3 py-2.5 text-[12px] border border-[#E3E8F0]">{detailInv.notes}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Payment details */}
                  <section>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6] mb-3">Payment Details</div>
                    <div className="space-y-2.5 text-[12.5px]">
                      {[
                        { label: "Requested Amount", value: detailInv.paymentRequestedAmount > 0 ? formatSAR(detailInv.paymentRequestedAmount) : "—" },
                        { label: "Requested Date", value: fmtDate(detailInv.paymentRequestedDate) },
                        { label: "Paid Amount", value: detailInv.paidAmount > 0 ? formatSAR(detailInv.paidAmount) : "—", color: "#1E8E55" },
                        { label: "Payment Received", value: fmtDate(detailInv.paymentReceivedDate) },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-[#6A788D] shrink-0">{label}</span>
                          <span className="text-right font-mono font-medium" style={{ color: color ?? "#14223B" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Related PO */}
                  {relatedPO && (
                    <>
                      <Separator />
                      <section>
                        <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6] mb-3">Related Purchase Order</div>
                        <div className="bg-[#F8F9FC] rounded-xl border border-[#E3E8F0] p-4 space-y-2.5 text-[12.5px]">
                          {[
                            { label: "PO Ref", value: relatedPO.poRef, mono: true },
                            { label: "Discipline", value: relatedPO.discipline },
                            { label: "Initiated By", value: relatedPO.initiatedBy || "—" },
                            { label: "PO Amount", value: formatSAR(relatedPO.amountWithVatSar), mono: true },
                          ].map(({ label, value, mono }) => (
                            <div key={label} className="flex justify-between gap-4">
                              <span className="text-[#6A788D]">{label}</span>
                              <span className={`font-medium text-[#14223B] ${mono ? "font-mono" : ""}`}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                </div>

                {/* Sticky footer */}
                <div className="shrink-0 px-6 py-4 bg-white border-t border-[#E3E8F0] flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 text-[12.5px]"
                    onClick={() => { openForm("editInvoice", { invoice: detailInv }); setDetailInv(null); }}>
                    <Edit2 size={13} className="mr-1.5" />Edit
                  </Button>
                  {detailInv.paymentStatus !== "Paid 100%" && (
                    <Button className="flex-1 h-9 text-[12.5px] text-white" style={{ background: "#1E8E55" }}
                      onClick={() => { openPayDialog(detailInv); setDetailInv(null); }}>
                      <DollarSign size={13} className="mr-1.5" />Record Payment
                    </Button>
                  )}
                  <Button variant="outline"
                    className="h-9 w-9 p-0 border-[#E3E8F0] text-[#C0453F] hover:bg-red-50 hover:border-[#C0453F]/30"
                    onClick={() => { setDeleteTarget(detailInv); setDetailInv(null); }}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Pay Dialog ── */}
      {payDialog && (
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="sm:max-w-[440px] p-7">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-[16px]">Record Payment — <span className="font-mono">{payDialog.invoiceRef}</span></DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-5">
                <div className="bg-[#F8F9FC] border border-[#E3E8F0] rounded-xl p-4 space-y-2 text-[12.5px]">
                  <div className="flex justify-between"><span className="text-[#6A788D]">Invoice Amount</span><span className="font-mono font-semibold text-[#14223B]">{formatSAR(payDialog.invoiceAmountWithVat)}</span></div>
                  {payDialog.paidAmount > 0 && <div className="flex justify-between"><span className="text-[#6A788D]">Already Paid</span><span className="font-mono font-semibold text-[#1E8E55]">{formatSAR(payDialog.paidAmount)}</span></div>}
                <div className="flex justify-between border-t border-[#E3E8F0] pt-2"><span className="text-[#6A788D] font-semibold">Outstanding</span><span className="font-mono font-bold text-[#C8901F] text-[13px]">{formatSAR(getInvoicePendingAmount(payDialog))}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-[13px]">Payment Date</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-10" /></div>
                <div className="grid gap-2"><Label className="text-[13px]">Amount (SAR) *</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} step="0.01" max={getInvoicePendingAmount(payDialog)} className="h-10" /></div>
              </div>
              <div className="grid gap-2"><Label className="text-[13px]">Reference Number *</Label><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN / Bank ref…" className="h-10" /></div>
              <div className="grid gap-2"><Label className="text-[13px]">Notes</Label><Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} /></div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button className="flex-1 h-10 text-white" style={{ background: "#1E8E55" }} onClick={handlePayment}>Record Payment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
