"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Search, ExternalLink, Edit2, Eye, Plus, DollarSign } from "lucide-react";
import Link from "next/link";
import type { ClientPO, ClientInvoice } from "@/lib/client-data/types";

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}>
      {status}
    </span>
  );
}

function DisciplineBadge({ disc }: { disc: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#1968D3]">
      {disc}
    </span>
  );
}

const ALL_STATUSES = ["All", "Paid 100%", "Partially Paid", "Invoice sent to HO", "To be Processed", "No Invoice"];

interface DetailState {
  po: ClientPO;
  invoice?: ClientInvoice;
  pendingAmount: number;
}

export default function PurchaseOrdersPage() {
  const { clientPOs, clientInvoices, stats } = useClientData();
  const { openForm } = useGlobalForms();

  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detailState, setDetailState] = useState<DetailState | null>(null);

  // Unique disciplines from existing POs
  const disciplines = ["All", ...Array.from(new Set(clientPOs.map((p) => p.discipline)))];

  // Enrich POs with their invoice
  const enriched = clientPOs.map((po) => {
    const invoice = clientInvoices.find((inv) => inv.cpoId === po.id);
    const pendingAmount = invoice ? Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount) : 0;
    return { po, invoice, pendingAmount };
  });

  const filtered = enriched.filter(({ po, invoice }) => {
    const matchSearch = search === "" ||
      po.poRef.toLowerCase().includes(search.toLowerCase()) ||
      po.description.toLowerCase().includes(search.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchDiscipline = disciplineFilter === "All" || po.discipline === disciplineFilter;
    const matchStatus = statusFilter === "All"
      || (statusFilter === "No Invoice" && !invoice)
      || (invoice && invoice.paymentStatus === statusFilter);
    return matchSearch && matchDiscipline && matchStatus;
  });

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Purchase Orders"
        subtitle="Jeddah Stadium procurement — all purchase orders."
        actions={
          <Button
            className="gap-2 text-white text-[12.5px]"
            style={{ background: "#E07B00" }}
            onClick={() => openForm("addPO")}
          >
            <Plus size={13} />Create PO
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total PO Value (w/VAT)" value={formatSAR(stats.totalPoValueWithVat)} subtext={`${stats.poCount} purchase orders`} icon={FileText} variant="info" />
        <StatCard label="Total Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} icon={FileText} />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} invoices`} icon={FileText} variant="success" />
        <StatCard label="Pending" value={formatSAR(stats.totalPending)} subtext={`${stats.overdueCount} overdue`} icon={FileText} variant={stats.overdueCount > 0 ? "danger" : "warning"} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search PO ref, description, vendor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={disciplineFilter} onValueChange={(v) => setDisciplineFilter(v ?? "All")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Disciplines" /></SelectTrigger>
          <SelectContent>
            {disciplines.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "All")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} of {clientPOs.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No purchase orders found" description="Try adjusting your filters or create a new PO." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#F8F9FC] sticky top-0">
                <tr className="border-b border-[#E3E8F0]">
                  {["Discipline", "PO Reference", "Vendor", "Date Issued", "Description", "PO Amount", "Amt w/VAT", "INCO Term", "Payment Term", "Invoice Ref", "Payment Status", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-3 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ po, invoice, pendingAmount }) => (
                  <tr key={po.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 px-3"><DisciplineBadge disc={po.discipline} /></td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold text-[#14223B]">{po.poRef}</td>
                    <td className="py-3 px-3 font-medium text-[#14223B] whitespace-nowrap">{po.vendorName}</td>
                    <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{po.dateIssued}</td>
                    <td className="py-3 px-3 text-[#14223B] max-w-[160px] truncate" title={po.description}>{po.description}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold">{formatSAR(po.poAmount)}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold">{formatSAR(po.amountWithVatSar)}</td>
                    <td className="py-3 px-3 text-[#6A788D]">{po.incoTerm || "—"}</td>
                    <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{po.paymentTerm || "—"}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] text-[#6A788D]">{invoice?.invoiceRef ?? "—"}</td>
                    <td className="py-3 px-3">
                      {invoice
                        ? <PaymentStatusBadge status={invoice.paymentStatus} />
                        : <span className="text-[11px] text-[#9AA6B6]">No invoice</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailState({ po, invoice, pendingAmount })}
                          className="flex items-center h-7 w-7 justify-center rounded text-[#1968D3] hover:bg-blue-50"
                          title="View details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => openForm("editPO", { po })}
                          className="flex items-center h-7 w-7 justify-center rounded text-[#6A788D] hover:bg-[#F0F3F8]"
                          title="Edit PO"
                        >
                          <Edit2 size={12} />
                        </button>
                        <Link href={`/purchase-orders/${po.id}`} className="flex items-center h-7 w-7 justify-center rounded text-[#E07B00] hover:bg-orange-50">
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!detailState} onOpenChange={() => setDetailState(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {detailState && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2">
                  <FileText size={16} className="text-[#E07B00]" />
                  PO Details — {detailState.po.poRef}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* PO Info */}
                <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#F8F9FC]">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-3">Purchase Order</div>
                  <div className="space-y-2 text-[12.5px]">
                    {[
                      { label: "PO Reference", value: detailState.po.poRef },
                      { label: "Vendor", value: detailState.po.vendorName },
                      { label: "Discipline", value: detailState.po.discipline },
                      { label: "Initiated By", value: detailState.po.initiatedBy },
                      { label: "Date Issued", value: detailState.po.dateIssued },
                      { label: "Description", value: detailState.po.description },
                      { label: "INCO Term", value: detailState.po.incoTerm || "—" },
                      { label: "Payment Term", value: detailState.po.paymentTerm || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[#6A788D]">{label}</span>
                        <span className="font-semibold text-[#14223B] text-right max-w-[240px]">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-2">
                      <span className="text-[#6A788D]">PO Amount (ex-VAT)</span>
                      <span className="font-bold text-[#14223B]">{formatSAR(detailState.po.amountWithoutVatSar)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6A788D]">Amount w/ VAT</span>
                      <span className="font-bold text-[#14223B]">{formatSAR(detailState.po.amountWithVatSar)}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                {detailState.invoice ? (
                  <div className="rounded-xl border border-[#E3E8F0] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-3">Linked Invoice</div>
                    <div className="space-y-2 text-[12.5px]">
                      {[
                        { label: "Invoice Ref", value: detailState.invoice.invoiceRef },
                        { label: "Invoice Date", value: detailState.invoice.invoiceDate },
                        { label: "Invoice Amt w/VAT", value: formatSAR(detailState.invoice.invoiceAmountWithVat) },
                        { label: "Paid Amount", value: detailState.invoice.paidAmount > 0 ? formatSAR(detailState.invoice.paidAmount) : "—" },
                        { label: "Pending", value: detailState.pendingAmount > 0 ? formatSAR(detailState.pendingAmount) : "—" },
                        { label: "Due Date", value: detailState.invoice.dueDate || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[#6A788D]">{label}</span>
                          <span className="font-semibold text-[#14223B]">{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-2">
                        <span className="text-[#6A788D]">Payment Status</span>
                        <PaymentStatusBadge status={detailState.invoice.paymentStatus} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E3E8F0] p-4 text-center">
                    <p className="text-[12.5px] text-[#9AA6B6] mb-3">No invoice linked to this PO yet.</p>
                    <Button
                      size="sm"
                      className="text-white text-[12px]"
                      style={{ background: "#E07B00" }}
                      onClick={() => { openForm("addInvoice", { po: detailState.po }); setDetailState(null); }}
                    >
                      Add Invoice for this PO
                    </Button>
                  </div>
                )}

                {detailState.po.notes && (
                  <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#FFFBEB]">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-1">Notes</div>
                    <p className="text-[12.5px] text-[#14223B]">{detailState.po.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { openForm("editPO", { po: detailState.po }); setDetailState(null); }}
                  >
                    <Edit2 size={13} className="mr-1.5" />Edit PO
                  </Button>
                  {detailState.invoice && detailState.invoice.paymentStatus !== "Paid 100%" && (
                    <Button
                      className="flex-1 text-white"
                      style={{ background: "#1E8E55" }}
                      onClick={() => { openForm("recordPayment", { invoice: detailState.invoice }); setDetailState(null); }}
                    >
                      <DollarSign size={13} className="mr-1.5" />Record Payment
                    </Button>
                  )}
                  <Link href={`/purchase-orders/${detailState.po.id}`}>
                    <Button variant="outline">
                      <ExternalLink size={13} />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
