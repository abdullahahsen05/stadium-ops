"use client";

import { useMemo, useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import {
  buildPaymentMutation,
  formatSAR,
  getInvoicePendingAmount,
  getPaymentStatusBg,
  getPaymentStatusColor,
  isDueSoon,
  isOverdue,
} from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  AlertTriangle,
  AlignJustify,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  FileText,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { ClientInvoice } from "@/lib/client-data/types";

const STATUS_OPTIONS = ["All", "Paid 100%", "Partially Paid", "Invoice sent to HO", "To be Processed"];

function fmtDate(date: string | undefined) {
  if (!date) return "-";
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}
    >
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-[12.5px]">
      <span className="text-[#6A788D] shrink-0">{label}</span>
      <span className={`text-right font-medium text-[#14223B] ${mono ? "font-mono" : ""}`} style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function PaymentsPage() {
  const {
    clientInvoices,
    clientPOs,
    mutations,
    stats,
    applyMutation,
    addClientActivity,
    deleteClientInvoice,
  } = useClientData();
  const { openForm } = useGlobalForms();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [density, setDensity] = useState<"compact" | "detailed">("compact");
  const [detailInvId, setDetailInvId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientInvoice | null>(null);
  const [payDialog, setPayDialog] = useState<ClientInvoice | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return clientInvoices.filter((inv) => {
      const matchesSearch = !q
        || inv.vendorName.toLowerCase().includes(q)
        || inv.invoiceRef.toLowerCase().includes(q)
        || inv.poRef.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || inv.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clientInvoices, search, statusFilter]);

  const detailInv = detailInvId ? clientInvoices.find((inv) => inv.id === detailInvId) ?? null : null;

  function openPayDialog(inv: ClientInvoice) {
    setPayDialog(inv);
    setPayAmount(getInvoicePendingAmount(inv).toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef("");
    setPayNotes("");
  }

  function handlePayment() {
    if (!payDialog) return;
    if (!payRef.trim()) {
      toast.error("Reference number is required");
      return;
    }

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
    toast.success(`Payment of ${formatSAR(amount)} recorded for ${payDialog.invoiceRef}`);
    setPayDialog(null);
  }

  function removeInvoice(inv: ClientInvoice) {
    deleteClientInvoice(inv.id);
    addClientActivity({
      action: "delete_invoice",
      description: `Deleted invoice ${inv.invoiceRef} from payments view`,
      referenceId: inv.id,
      referenceRef: inv.invoiceRef,
      performedBy: "Ali Khan",
    });
    toast.success(`Invoice ${inv.invoiceRef} deleted`);
    if (detailInvId === inv.id) setDetailInvId(null);
    setDeleteTarget(null);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Payments"
        subtitle="Track payment status and settlement actions for Jeddah Stadium procurement invoices."
        actions={
          <Button
            className="gap-2 text-white text-[12.5px]"
            style={{ background: "#1E8E55" }}
            onClick={() => openForm("recordPayment")}
          >
            <Plus size={13} />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 mb-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} fully settled`} icon={CheckCircle} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.invoiceCount - stats.paidCount} outstanding`} icon={Clock} variant="warning" />
        <StatCard label="Overdue Amount" value={stats.totalOverdueAmount > 0 ? formatSAR(stats.totalOverdueAmount) : "None"} subtext={stats.overdueCount > 0 ? `${stats.overdueCount} invoices` : "All within terms"} icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "success"} />
        <StatCard label="Sent to HO" value={String(stats.invoiceSentToHoCount)} subtext="Awaiting HO release" icon={DollarSign} variant="info" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input
            placeholder="Search vendor, invoice, PO..."
            className="h-9 pl-9 text-[13px]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "All")}>
          <SelectTrigger className="h-9 w-48 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12.5px] text-[#9AA6B6]">{filtered.length} of {clientInvoices.length}</span>
          <div className="flex items-center overflow-hidden rounded-lg border border-[#E3E8F0] bg-white">
            {(["compact", "detailed"] as const).map((mode, index) => (
              <div key={mode} className="flex items-center">
                {index > 0 && <div className="h-5 w-px bg-[#E3E8F0]" />}
                <button
                  onClick={() => setDensity(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    density === mode ? "bg-[#F5F7FB] text-[#14223B]" : "text-[#9AA6B6] hover:text-[#6A788D]"
                  }`}
                >
                  {mode === "compact" ? <LayoutList size={13} /> : <AlignJustify size={13} />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E3E8F0] bg-white" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records found" />
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#F8F9FC]">
                {[
                  "Vendor / Invoice",
                  "PO Ref",
                  ...(density === "detailed" ? ["Requested Date"] : []),
                  "Requested",
                  "Paid",
                  "Pending",
                  "Due Date",
                  "Status",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6A788D] whitespace-nowrap ${
                      heading === "Vendor / Invoice" ? "w-[24%]" :
                      heading === "PO Ref" ? "w-[16%]" :
                      heading === "Status" ? "w-[13%]" :
                      heading === "" ? "w-[110px]" :
                      ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const pending = getInvoicePendingAmount(inv);
                const overdue = pending > 0 && isOverdue(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
                const dueSoon = pending > 0 && !overdue && isDueSoon(inv.dueDate) && inv.paymentStatus !== "Paid 100%";

                return (
                  <tr
                    key={inv.id}
                    onClick={() => setDetailInvId(inv.id)}
                    className={`cursor-pointer border-b border-[#F0F3F8] transition-colors hover:bg-[#F8F9FC] ${
                      overdue ? "bg-red-50/20" : dueSoon ? "bg-amber-50/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-[#14223B]" title={inv.vendorName}>
                        {inv.vendorName}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11.5px] text-[#6A788D]" title={inv.invoiceRef}>
                        {inv.invoiceRef}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 min-w-0">
                      <span className="block truncate font-mono text-[11.5px] text-[#6A788D]" title={inv.poRef}>
                        {inv.poRef || "-"}
                      </span>
                    </td>
                    {density === "detailed" && (
                      <td className="px-4 py-3.5 text-[12px] text-[#6A788D] whitespace-nowrap">
                        {fmtDate(inv.paymentRequestedDate)}
                      </td>
                    )}
                    <td className="px-4 py-3.5 font-mono text-[11.5px] font-semibold text-[#14223B] truncate">
                      {inv.paymentRequestedAmount > 0 ? formatSAR(inv.paymentRequestedAmount) : formatSAR(inv.invoiceAmountWithVat)}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-[11.5px] font-semibold truncate ${inv.paidAmount > 0 ? "text-[#1E8E55]" : "text-[#C8B9A0]"}`}>
                      {inv.paidAmount > 0 ? formatSAR(inv.paidAmount) : "-"}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-[11.5px] font-semibold truncate ${
                      pending <= 0 ? "text-[#1E8E55]" : overdue ? "text-[#C0453F]" : "text-[#C8901F]"
                    }`}>
                      {pending > 0 ? formatSAR(pending) : "-"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className={`text-[12px] font-medium ${overdue ? "text-[#C0453F]" : dueSoon ? "text-[#C8901F]" : "text-[#6A788D]"}`}>
                        {fmtDate(inv.dueDate)}
                      </div>
                      {overdue && <div className="mt-0.5 text-[10px] font-bold tracking-wide text-[#C0453F]">OVERDUE</div>}
                      {dueSoon && <div className="mt-0.5 text-[10px] font-bold tracking-wide text-[#C8901F]">DUE SOON</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <PaymentStatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.paymentStatus !== "Paid 100%" && pending > 0 && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2.5 text-[11px] font-semibold text-white"
                            style={{ background: "#1E8E55" }}
                            onClick={() => openPayDialog(inv)}
                          >
                            <DollarSign size={11} />
                            Pay
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded text-[#9AA6B6] transition-colors hover:bg-[#F0F3F8] hover:text-[#6A788D]">
                            <MoreHorizontal size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setDetailInvId(inv.id)}>
                              <FileText size={13} className="mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {inv.paymentStatus !== "Paid 100%" && pending > 0 && (
                              <DropdownMenuItem onClick={() => openPayDialog(inv)}>
                                <DollarSign size={13} className="mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openForm("editInvoice", { invoice: inv })}>
                              <Edit2 size={13} className="mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[#C0453F] focus:bg-red-50 focus:text-[#C0453F]"
                              onClick={() => setDeleteTarget(inv)}
                            >
                              <Trash2 size={13} className="mr-2" />
                              Delete Invoice
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

      <Sheet open={!!detailInv} onOpenChange={(open) => { if (!open) setDetailInvId(null); }}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px] p-0 flex flex-col overflow-hidden">
          {detailInv && (() => {
            const pending = getInvoicePendingAmount(detailInv);
            const relatedPO = clientPOs.find((po) => po.id === detailInv.cpoId);
            const lastPayment = mutations.find((mutation) => mutation.invoiceId === detailInv.id);

            return (
              <>
                <div className="shrink-0 border-b border-[#E3E8F0] px-6 pb-5 pt-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Payment Record</div>
                      <div className="truncate font-mono text-[17px] font-bold leading-tight text-[#14223B]" title={detailInv.invoiceRef}>
                        {detailInv.invoiceRef}
                      </div>
                      <div className="mt-1 truncate text-[13px] leading-snug text-[#6A788D]" title={detailInv.vendorName}>
                        {detailInv.vendorName}
                      </div>
                    </div>
                    <PaymentStatusBadge status={detailInv.paymentStatus} />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">Invoice</div>
                      <div className="font-mono text-[12.5px] font-bold text-[#14223B]">{formatSAR(detailInv.invoiceAmountWithVat)}</div>
                    </div>
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">Paid</div>
                      <div className="font-mono text-[12.5px] font-bold text-[#1E8E55]">{detailInv.paidAmount > 0 ? formatSAR(detailInv.paidAmount) : "-"}</div>
                    </div>
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">Pending</div>
                      <div className="font-mono text-[12.5px] font-bold" style={{ color: pending > 0 ? "#C8901F" : "#9AA6B6" }}>
                        {pending > 0 ? formatSAR(pending) : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <section>
                    <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Payment Details</div>
                    <div className="space-y-2.5">
                      <DetailRow label="Vendor" value={detailInv.vendorName} />
                      <DetailRow label="Invoice Ref" value={detailInv.invoiceRef} mono />
                      <DetailRow label="PO Ref" value={detailInv.poRef || "-"} mono />
                      <DetailRow label="Invoice Amount" value={formatSAR(detailInv.invoiceAmountWithVat)} mono />
                      <DetailRow label="Payment Requested Amount" value={detailInv.paymentRequestedAmount > 0 ? formatSAR(detailInv.paymentRequestedAmount) : "-"} mono />
                      <DetailRow label="Paid Amount" value={detailInv.paidAmount > 0 ? formatSAR(detailInv.paidAmount) : "-"} mono color="#1E8E55" />
                      <DetailRow label="Pending Amount" value={pending > 0 ? formatSAR(pending) : "-"} mono color={pending > 0 ? "#C8901F" : "#9AA6B6"} />
                      <DetailRow label="Payment Requested Date" value={fmtDate(detailInv.paymentRequestedDate)} />
                      <DetailRow label="Payment Received Date" value={fmtDate(detailInv.paymentReceivedDate)} />
                      <DetailRow label="Credit Days" value={`${detailInv.creditDays ?? 60} days`} />
                      <DetailRow label="Due Date" value={fmtDate(detailInv.dueDate)} />
                      <DetailRow label="Status" value={detailInv.paymentStatus} />
                    </div>
                  </section>

                  {(lastPayment || detailInv.notes) && (
                    <>
                      <Separator />
                      <section>
                        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Reference & Notes</div>
                        <div className="space-y-2.5">
                          {lastPayment && <DetailRow label="Last Payment Ref" value={lastPayment.referenceNumber || "-"} mono />}
                          {detailInv.notes && (
                            <p className="rounded-lg border border-[#E3E8F0] bg-[#F8F9FC] px-3 py-2.5 text-[12px] text-[#14223B]">
                              {detailInv.notes}
                            </p>
                          )}
                        </div>
                      </section>
                    </>
                  )}

                  {relatedPO && (
                    <>
                      <Separator />
                      <section>
                        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Related Purchase Order</div>
                        <div className="space-y-2.5 rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-4">
                          <DetailRow label="PO Ref" value={relatedPO.poRef} mono />
                          <DetailRow label="Discipline" value={relatedPO.discipline} />
                          <DetailRow label="Initiated By" value={relatedPO.initiatedBy || "-"} />
                          <DetailRow label="PO Amount" value={formatSAR(relatedPO.amountWithVatSar)} mono />
                        </div>
                      </section>
                    </>
                  )}
                </div>

                <div className="flex shrink-0 gap-2 border-t border-[#E3E8F0] bg-white px-6 py-4">
                  {detailInv.paymentStatus !== "Paid 100%" && pending > 0 && (
                    <Button
                      className="h-9 flex-1 text-[12.5px] text-white"
                      style={{ background: "#1E8E55" }}
                      onClick={() => {
                        openPayDialog(detailInv);
                        setDetailInvId(null);
                      }}
                    >
                      <DollarSign size={13} className="mr-1.5" />
                      Record Payment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-9 flex-1 text-[12.5px]"
                    onClick={() => {
                      openForm("editInvoice", { invoice: detailInv });
                      setDetailInvId(null);
                    }}
                  >
                    <Edit2 size={13} className="mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 w-9 p-0 text-[#C0453F] hover:border-[#C0453F]/30 hover:bg-red-50"
                    onClick={() => {
                      setDeleteTarget(detailInv);
                      setDetailInvId(null);
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-[13px] text-[#6A788D]">
            Delete <strong className="font-mono text-[#14223B]">{deleteTarget?.invoiceRef}</strong>? This removes the invoice from the client-data demo.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="h-9 flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="h-9 flex-1 text-white"
              style={{ background: "#C0453F" }}
              onClick={() => {
                if (deleteTarget) removeInvoice(deleteTarget);
              }}
            >
              <Trash2 size={13} className="mr-1.5" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {payDialog && (
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="sm:max-w-[440px] p-7">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-[16px]">
                Record Payment - <span className="font-mono">{payDialog.invoiceRef}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-5">
              <div className="space-y-2 rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-4 text-[12.5px]">
                <div className="flex justify-between gap-4">
                  <span className="text-[#6A788D]">Vendor</span>
                  <span className="truncate font-semibold text-[#14223B]" title={payDialog.vendorName}>{payDialog.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A788D]">Invoice Amount</span>
                  <span className="font-mono font-semibold text-[#14223B]">{formatSAR(payDialog.invoiceAmountWithVat)}</span>
                </div>
                {payDialog.paidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6A788D]">Already Paid</span>
                    <span className="font-mono font-semibold text-[#1E8E55]">{formatSAR(payDialog.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#E3E8F0] pt-2">
                  <span className="font-semibold text-[#6A788D]">Outstanding</span>
                  <span className="font-mono text-[13px] font-bold text-[#C8901F]">{formatSAR(getInvoicePendingAmount(payDialog))}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[13px]">Payment Date</Label>
                  <Input type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} className="h-10" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px]">Amount (SAR) *</Label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(event) => setPayAmount(event.target.value)}
                    step="0.01"
                    max={getInvoicePendingAmount(payDialog)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[13px]">Reference Number *</Label>
                <Input value={payRef} onChange={(event) => setPayRef(event.target.value)} placeholder="TXN / Bank ref..." className="h-10" />
              </div>

              <div className="grid gap-2">
                <Label className="text-[13px]">Notes</Label>
                <Textarea rows={2} value={payNotes} onChange={(event) => setPayNotes(event.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="h-10 flex-1" onClick={() => setPayDialog(null)}>
                  Cancel
                </Button>
                <Button className="h-10 flex-1 text-white" style={{ background: "#1E8E55" }} onClick={handlePayment}>
                  Record Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
