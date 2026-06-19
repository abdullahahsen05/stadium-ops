"use client";

import { useMemo, useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import {
  formatSAR,
  getPaymentStatusBg,
  getPaymentStatusColor,
  getPOPaymentState,
} from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DollarSign,
  Edit2,
  FilePlus2,
  FileText,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { ClientActivity, ClientInvoice, ClientPO } from "@/lib/client-data/types";

const ALL_STATUSES = [
  "All",
  "No Invoice Yet",
  "Invoice Received",
  "To be Processed",
  "Invoice sent to HO",
  "Partially Paid",
  "Paid 100%",
  "Overdue",
];

interface EnrichedPO {
  po: ClientPO;
  invoice?: ClientInvoice;
  pendingAmount: number;
  paidAmount: number;
  statusLabel: string;
  status: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}

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
      className="inline-flex max-w-full items-center overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}
      title={status}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}

function DisciplineBadge({ discipline }: { discipline: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded px-2 py-0.5 text-[11px] font-semibold text-[#1968D3] bg-[#EFF6FF]">
      <span className="truncate">{discipline || "-"}</span>
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
      <span className="shrink-0 text-[#6A788D]">{label}</span>
      <span
        className={`text-right font-medium text-[#14223B] ${mono ? "font-mono" : ""}`}
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function ActivityList({ activity }: { activity: ClientActivity[] }) {
  if (activity.length === 0) {
    return <p className="text-[12.5px] text-[#9AA6B6]">No activity captured for this PO yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activity.slice(0, 6).map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E07B00]" />
          <div className="min-w-0">
            <p className="text-[12.5px] leading-snug text-[#14223B]">{entry.description}</p>
            <p className="mt-0.5 text-[11px] text-[#9AA6B6]">
              {entry.performedBy} · {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const {
    clientPOs,
    clientInvoices,
    clientActivity,
    stats,
    deleteClientPO,
    addClientActivity,
  } = useClientData();
  const { openForm } = useGlobalForms();

  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [density, setDensity] = useState<"compact" | "detailed">("compact");
  const [detailPOId, setDetailPOId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientPO | null>(null);

  const disciplines = useMemo(
    () => ["All", ...Array.from(new Set(clientPOs.map((po) => po.discipline))).sort()],
    [clientPOs],
  );

  const enriched = useMemo<EnrichedPO[]>(() => {
    return clientPOs.map((po) => {
      const invoice = clientInvoices.find((inv) => inv.cpoId === po.id);
      const paymentState = getPOPaymentState(invoice);

      return {
        po,
        invoice,
        pendingAmount: paymentState.pendingAmount,
        paidAmount: paymentState.paidAmount,
        statusLabel: paymentState.label,
        status: paymentState.status,
        isOverdue: paymentState.isOverdue,
        isDueSoon: paymentState.isDueSoon,
      };
    });
  }, [clientInvoices, clientPOs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enriched.filter(({ po, invoice, statusLabel, status }) => {
      const matchesSearch = !query
        || po.poRef.toLowerCase().includes(query)
        || po.description.toLowerCase().includes(query)
        || po.vendorName.toLowerCase().includes(query)
        || invoice?.invoiceRef.toLowerCase().includes(query);
      const matchesDiscipline = disciplineFilter === "All" || po.discipline === disciplineFilter;
      const matchesStatus = statusFilter === "All"
        || statusLabel === statusFilter
        || status === statusFilter;

      return matchesSearch && matchesDiscipline && matchesStatus;
    });
  }, [disciplineFilter, enriched, search, statusFilter]);

  const detailState = detailPOId ? enriched.find(({ po }) => po.id === detailPOId) ?? null : null;

  function handleDelete(po: ClientPO) {
    deleteClientPO(po.id);
    addClientActivity({
      action: "delete_po",
      description: `Deleted PO ${po.poRef} - ${po.vendorName}`,
      referenceId: po.id,
      referenceRef: po.poRef,
      performedBy: "Ali Khan",
    });
    toast.success(`PO ${po.poRef} deleted`);
    if (detailPOId === po.id) setDetailPOId(null);
    setDeleteTarget(null);
  }

  function openAddInvoice(po: ClientPO) {
    openForm("addInvoice", { po });
    setDetailPOId(null);
  }

  function openRecordPayment(invoice: ClientInvoice) {
    openForm("recordPayment", { invoice });
    setDetailPOId(null);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Purchase Orders"
        subtitle="Jeddah Stadium procurement purchase orders, linked invoices, and payment state."
        actions={
          <Button
            className="gap-2 text-white text-[12.5px]"
            style={{ background: "#E07B00" }}
            onClick={() => openForm("addPO")}
          >
            <Plus size={13} />
            Create PO
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total PO Value" value={formatSAR(stats.totalPoValueWithVat)} subtext={`${stats.poCount} purchase orders`} icon={FileText} variant="info" />
        <StatCard label="Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} subtext={`${stats.invoiceCount} linked invoices`} icon={FileText} />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} fully settled`} icon={CheckCircle} variant="success" />
        <StatCard label="Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.overdueCount} overdue`} icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "warning"} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input
            placeholder="Search PO, vendor, invoice..."
            className="h-9 pl-9 text-[13px]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={disciplineFilter} onValueChange={(value) => setDisciplineFilter(value ?? "All")}>
          <SelectTrigger className="h-9 w-44 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map((discipline) => (
              <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "All")}>
          <SelectTrigger className="h-9 w-48 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12.5px] text-[#9AA6B6]">{filtered.length} of {clientPOs.length}</span>
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
          <EmptyState icon={FileText} title="No purchase orders found" description="Try adjusting your filters or create a new PO." />
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#F8F9FC]">
                {[
                  "PO Reference",
                  "Vendor",
                  "Discipline",
                  "Date Issued",
                  ...(density === "detailed" ? ["Terms"] : []),
                  "PO Summary",
                  "Invoice / Payment",
                  "Status",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6A788D] whitespace-nowrap ${
                      heading === "PO Reference" ? (density === "detailed" ? "w-[12%]" : "w-[13%]") :
                      heading === "Vendor" ? (density === "detailed" ? "w-[11%]" : "w-[12%]") :
                      heading === "Discipline" ? (density === "detailed" ? "w-[7%]" : "w-[8%]") :
                      heading === "Date Issued" ? (density === "detailed" ? "w-[9%]" : "w-[10%]") :
                      heading === "Terms" ? "w-[11%]" :
                      heading === "PO Summary" ? (density === "detailed" ? "w-[18%]" : "w-[21%]") :
                      heading === "Invoice / Payment" ? (density === "detailed" ? "w-[15%]" : "w-[16%]") :
                      heading === "Status" ? (density === "detailed" ? "w-[9%]" : "w-[10%]") :
                      heading === "" ? (density === "detailed" ? "w-[8%]" : "w-[10%]") :
                      ""
                    }`}
                    title={heading}
                  >
                    <span className="block truncate">{heading}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ po, invoice, pendingAmount, paidAmount, statusLabel, isOverdue, isDueSoon }) => (
                <tr
                  key={po.id}
                  onClick={() => setDetailPOId(po.id)}
                  className={`cursor-pointer border-b border-[#F0F3F8] transition-colors hover:bg-[#F8F9FC] ${
                    isOverdue ? "bg-red-50/20" : isDueSoon ? "bg-amber-50/10" : ""
                  }`}
                >
                  <td className="min-w-0 px-3 py-3.5">
                    <span className="block truncate font-mono text-[12px] font-semibold text-[#14223B]" title={po.poRef}>
                      {po.poRef}
                    </span>
                  </td>
                  <td className="min-w-0 px-3 py-3.5">
                    <span className="block truncate text-[12.5px] font-semibold text-[#14223B]" title={po.vendorName}>
                      {po.vendorName}
                    </span>
                  </td>
                  <td className="min-w-0 px-3 py-3.5">
                    <DisciplineBadge discipline={po.discipline} />
                  </td>
                  <td className="min-w-0 px-3 py-3.5 text-[12px] font-medium text-[#6A788D]">
                    <span className="block truncate" title={fmtDate(po.dateIssued)}>
                      {fmtDate(po.dateIssued)}
                    </span>
                  </td>
                  {density === "detailed" && (
                    <td className="min-w-0 px-3 py-3.5">
                      <div className="truncate text-[11.5px] text-[#6A788D]" title={po.incoTerm || ""}>
                        INCO: {po.incoTerm || "-"}
                      </div>
                      <div className="mt-1 truncate text-[11.5px] text-[#9AA6B6]" title={po.paymentTerm || ""}>
                        {po.paymentTerm || "-"}
                      </div>
                    </td>
                  )}
                  <td className="min-w-0 px-3 py-3.5">
                    <div className="truncate text-[12px] font-medium text-[#14223B]" title={po.description}>
                      {po.description}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11.5px]">
                      <span className="text-[#9AA6B6]">PO</span>
                      <span className="truncate font-mono font-semibold text-[#14223B]">{formatSAR(po.amountWithoutVatSar)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11.5px]">
                      <span className="text-[#9AA6B6]">With VAT</span>
                      <span className="truncate font-mono font-semibold text-[#E07B00]">{formatSAR(po.amountWithVatSar)}</span>
                    </div>
                  </td>
                  <td className="min-w-0 px-3 py-3.5">
                    {invoice ? (
                      <div className="space-y-1 text-[11.5px]">
                        <div className="truncate font-mono font-semibold text-[#14223B]" title={invoice.invoiceRef}>
                          Invoice: {invoice.invoiceRef}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#9AA6B6]">Paid</span>
                          <span className={`truncate font-mono font-semibold ${paidAmount > 0 ? "text-[#1E8E55]" : "text-[#C8B9A0]"}`}>
                            {paidAmount > 0 ? formatSAR(paidAmount) : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#9AA6B6]">Pending</span>
                          <span className={`truncate font-mono font-semibold ${pendingAmount > 0 ? "text-[#C8901F]" : "text-[#C8B9A0]"}`}>
                            {pendingAmount > 0 ? formatSAR(pendingAmount) : "-"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] font-medium text-[#9AA6B6]">No invoice yet</div>
                    )}
                  </td>
                  <td className="min-w-0 px-3 py-3.5">
                    <PaymentStatusBadge status={statusLabel} />
                  </td>
                  <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {!invoice && (
                        <Button
                          size="sm"
                          className="h-7 gap-1 px-2.5 text-[11px] font-semibold text-white"
                          style={{ background: "#E07B00" }}
                          onClick={() => openAddInvoice(po)}
                        >
                          <FilePlus2 size={11} />
                          Invoice
                        </Button>
                      )}
                      {invoice && invoice.paymentStatus !== "Paid 100%" && (
                        <Button
                          size="sm"
                          className="h-7 gap-1 px-2.5 text-[11px] font-semibold text-white"
                          style={{ background: "#1E8E55" }}
                          onClick={() => openRecordPayment(invoice)}
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
                          <DropdownMenuItem onClick={() => setDetailPOId(po.id)}>
                            <FileText size={13} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openForm("editPO", { po })}>
                            <Edit2 size={13} className="mr-2" />
                            Edit PO
                          </DropdownMenuItem>
                          {!invoice && (
                            <DropdownMenuItem onClick={() => openAddInvoice(po)}>
                              <FilePlus2 size={13} className="mr-2" />
                              Add Invoice
                            </DropdownMenuItem>
                          )}
                          {invoice && invoice.paymentStatus !== "Paid 100%" && (
                            <DropdownMenuItem onClick={() => openRecordPayment(invoice)}>
                              <DollarSign size={13} className="mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[#C0453F] focus:bg-red-50 focus:text-[#C0453F]"
                            onClick={() => setDeleteTarget(po)}
                          >
                            <Trash2 size={13} className="mr-2" />
                            Delete PO
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Sheet open={!!detailState} onOpenChange={(open) => { if (!open) setDetailPOId(null); }}>
        <SheetContent side="right" className="w-[540px] sm:max-w-[540px] p-0 flex flex-col overflow-hidden">
          {detailState && (() => {
            const { po, invoice, pendingAmount, paidAmount, statusLabel, isOverdue } = detailState;
            const activity = clientActivity.filter((entry) =>
              entry.referenceId === po.id
              || entry.referenceRef === po.poRef
              || (invoice && (entry.referenceId === invoice.id || entry.referenceRef === invoice.invoiceRef))
            );

            return (
              <>
                <div className="shrink-0 border-b border-[#E3E8F0] px-6 pb-5 pt-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Purchase Order</div>
                      <div className="truncate font-mono text-[17px] font-bold leading-tight text-[#14223B]" title={po.poRef}>
                        {po.poRef}
                      </div>
                      <div className="mt-1 truncate text-[13px] leading-snug text-[#6A788D]" title={po.vendorName}>
                        {po.vendorName}
                      </div>
                    </div>
                    <PaymentStatusBadge status={statusLabel} />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">Ex-VAT</div>
                      <div className="font-mono text-[12.5px] font-bold text-[#14223B]">{formatSAR(po.amountWithoutVatSar)}</div>
                    </div>
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">With VAT</div>
                      <div className="font-mono text-[12.5px] font-bold text-[#E07B00]">{formatSAR(po.amountWithVatSar)}</div>
                    </div>
                    <div className="rounded-xl border border-[#E3E8F0] bg-[#F8F9FC] p-3">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6]">Pending</div>
                      <div className="font-mono text-[12.5px] font-bold" style={{ color: pendingAmount > 0 ? "#C8901F" : "#9AA6B6" }}>
                        {pendingAmount > 0 ? formatSAR(pendingAmount) : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <section>
                    <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">PO Details</div>
                    <div className="space-y-2.5">
                      <DetailRow label="PO Reference" value={po.poRef} mono />
                      <DetailRow label="Discipline" value={po.discipline || "-"} />
                      <DetailRow label="Vendor" value={po.vendorName || "-"} />
                      <DetailRow label="Initiated By" value={po.initiatedBy || "-"} />
                      <DetailRow label="Date Issued" value={fmtDate(po.dateIssued)} />
                      <DetailRow label="Quantity" value={po.quantity || "-"} />
                      <DetailRow label="Currency" value={po.currency || "SAR"} />
                      <DetailRow label="XE Conversion / Exchange Rate" value={String(po.xeConversion ?? 1)} mono />
                      <DetailRow label="PO Amount" value={formatSAR(po.poAmount)} mono />
                      <DetailRow label="PO Amount SAR without VAT" value={formatSAR(po.amountWithoutVatSar)} mono />
                      <DetailRow label="PO Amount SAR with VAT" value={formatSAR(po.amountWithVatSar)} mono />
                      <DetailRow label="INCO Term" value={po.incoTerm || "-"} />
                      <DetailRow label="Payment Term" value={po.paymentTerm || "-"} />
                      <div className="pt-1">
                        <div className="mb-1 text-[#6A788D] text-[12.5px]">Item Description</div>
                        <p className="rounded-lg border border-[#E3E8F0] bg-[#F8F9FC] px-3 py-2.5 text-[12px] text-[#14223B]">
                          {po.description || "-"}
                        </p>
                      </div>
                      {po.notes && (
                        <div className="pt-1">
                          <div className="mb-1 text-[#6A788D] text-[12.5px]">Notes</div>
                          <p className="rounded-lg border border-[#E3E8F0] bg-[#FFFBEB] px-3 py-2.5 text-[12px] text-[#14223B]">
                            {po.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Invoice & Payment</div>
                    {invoice ? (
                      <div className="space-y-2.5">
                        <DetailRow label="Linked Invoice Reference" value={invoice.invoiceRef} mono />
                        <DetailRow label="Invoice Date" value={fmtDate(invoice.invoiceDate)} />
                        <DetailRow label="Invoice Amount With VAT" value={formatSAR(invoice.invoiceAmountWithVat)} mono />
                        <DetailRow label="Payment Requested Amount" value={invoice.paymentRequestedAmount > 0 ? formatSAR(invoice.paymentRequestedAmount) : "-"} mono />
                        <DetailRow label="Paid Amount" value={paidAmount > 0 ? formatSAR(paidAmount) : "-"} mono color="#1E8E55" />
                        <DetailRow label="Pending Amount" value={pendingAmount > 0 ? formatSAR(pendingAmount) : "-"} mono color={pendingAmount > 0 ? "#C8901F" : "#9AA6B6"} />
                        <DetailRow label="Payment Status" value={isOverdue ? "Overdue" : invoice.paymentStatus} />
                        <DetailRow label="Due Date" value={fmtDate(invoice.dueDate)} />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#E3E8F0] p-4 text-center">
                        <p className="mb-3 text-[12.5px] text-[#9AA6B6]">No invoice linked to this PO yet.</p>
                        <Button
                          size="sm"
                          className="text-[12px] text-white"
                          style={{ background: "#E07B00" }}
                          onClick={() => openAddInvoice(po)}
                        >
                          <FilePlus2 size={13} className="mr-1.5" />
                          Add Invoice
                        </Button>
                      </div>
                    )}
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9AA6B6]">Activity History</div>
                    <ActivityList activity={activity} />
                  </section>
                </div>

                <div className="flex shrink-0 gap-2 border-t border-[#E3E8F0] bg-white px-6 py-4">
                  <Button
                    variant="outline"
                    className="h-9 flex-1 text-[12.5px]"
                    onClick={() => {
                      openForm("editPO", { po });
                      setDetailPOId(null);
                    }}
                  >
                    <Edit2 size={13} className="mr-1.5" />
                    Edit PO
                  </Button>
                  {!invoice && (
                    <Button
                      className="h-9 flex-1 text-[12.5px] text-white"
                      style={{ background: "#E07B00" }}
                      onClick={() => openAddInvoice(po)}
                    >
                      <FilePlus2 size={13} className="mr-1.5" />
                      Add Invoice
                    </Button>
                  )}
                  {invoice && invoice.paymentStatus !== "Paid 100%" && (
                    <Button
                      className="h-9 flex-1 text-[12.5px] text-white"
                      style={{ background: "#1E8E55" }}
                      onClick={() => openRecordPayment(invoice)}
                    >
                      <DollarSign size={13} className="mr-1.5" />
                      Record Payment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-9 w-9 p-0 text-[#C0453F] hover:border-[#C0453F]/30 hover:bg-red-50"
                    onClick={() => {
                      setDeleteTarget(po);
                      setDetailPOId(null);
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
            <DialogTitle>Delete Purchase Order</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-[13px] text-[#6A788D]">
            Delete <strong className="font-mono text-[#14223B]">{deleteTarget?.poRef}</strong>? This removes it from the client-data demo.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="h-9 flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="h-9 flex-1 text-white"
              style={{ background: "#C0453F" }}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
              }}
            >
              <Trash2 size={13} className="mr-1.5" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
