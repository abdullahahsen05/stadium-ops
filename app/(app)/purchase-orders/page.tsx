"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Search, ExternalLink, Edit2, Eye } from "lucide-react";
import Link from "next/link";
import type { ClientRecord } from "@/lib/client-data/types";

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

const ALL_DISCIPLINES = ["All", "TSF", "Safety Equipments", "Consumables", "ELECTRICAL"];
const ALL_STATUSES = ["All", "Paid 100%", "Partially Paid", "Invoice sent to HO", "To be Processed"];

export default function PurchaseOrdersPage() {
  const { clientRecords, stats, applyPOEdit, addClientActivity } = useClientData();

  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail drawer
  const [detailRecord, setDetailRecord] = useState<ClientRecord | null>(null);

  // Edit PO dialog
  const [editRecord, setEditRecord] = useState<ClientRecord | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDisc, setEditDisc] = useState("");
  const [editInco, setEditInco] = useState("");
  const [editPayTerm, setEditPayTerm] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const filtered = clientRecords.filter((r) => {
    const matchSearch = search === "" ||
      r.po.poRef.toLowerCase().includes(search.toLowerCase()) ||
      r.po.description.toLowerCase().includes(search.toLowerCase()) ||
      r.po.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchDiscipline = disciplineFilter === "All" || r.po.discipline === disciplineFilter;
    const matchStatus = statusFilter === "All" || r.invoice?.paymentStatus === statusFilter;
    return matchSearch && matchDiscipline && matchStatus;
  });

  function openEdit(record: ClientRecord) {
    setEditRecord(record);
    setEditDesc(record.po.description);
    setEditDisc(record.po.discipline);
    setEditInco(record.po.incoTerm);
    setEditPayTerm(record.po.paymentTerm);
    setEditNotes(record.po.notes ?? "");
  }

  function saveEdit() {
    if (!editRecord) return;
    applyPOEdit({
      poId: editRecord.po.id,
      discipline: editDisc,
      description: editDesc,
      incoTerm: editInco,
      paymentTerm: editPayTerm,
      notes: editNotes,
      updatedAt: new Date().toISOString(),
    });
    addClientActivity({
      action: "updated",
      description: `Edited PO ${editRecord.po.poRef} — ${editRecord.po.vendorName}`,
      referenceId: editRecord.po.id,
      referenceRef: editRecord.po.poRef,
      performedBy: "Ali Khan",
    });
    toast.success(`PO ${editRecord.po.poRef} updated`);
    setEditRecord(null);
    // Refresh detail if open
    if (detailRecord?.po.id === editRecord.po.id) {
      setDetailRecord(null);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Purchase Orders"
        subtitle="Jeddah Stadium procurement — imported from Excel tracker."
        actions={
          <Link href="/data-import">
            <Button variant="outline" size="sm" className="gap-2 text-[12.5px]">
              <FileText size={13} />Data Import
            </Button>
          </Link>
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
            {ALL_DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "All")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} of {clientRecords.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No purchase orders found" description="Try adjusting your filters." />
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
                {filtered.map(({ po, invoice, isOverdue: ov }) => (
                  <tr key={po.id} className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors ${ov ? "bg-red-50/20" : ""}`}>
                    <td className="py-3 px-3"><DisciplineBadge disc={po.discipline} /></td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold text-[#14223B]">{po.poRef}</td>
                    <td className="py-3 px-3 font-medium text-[#14223B] whitespace-nowrap">{po.vendorName}</td>
                    <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{po.dateIssued}</td>
                    <td className="py-3 px-3 text-[#14223B] max-w-[160px] truncate" title={po.description}>{po.description}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold">{formatSAR(po.poAmount)}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] font-semibold">{formatSAR(po.amountWithVatSar)}</td>
                    <td className="py-3 px-3 text-[#6A788D]">{po.incoTerm}</td>
                    <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{po.paymentTerm}</td>
                    <td className="py-3 px-3 font-mono text-[11.5px] text-[#6A788D]">{invoice?.invoiceRef ?? "—"}</td>
                    <td className="py-3 px-3">
                      {invoice && <PaymentStatusBadge status={invoice.paymentStatus} />}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailRecord({ po, invoice, pendingAmount: Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount), isOverdue: ov, isDueSoon: false })}
                          className="flex items-center gap-1 h-7 px-2 rounded text-[11px] font-semibold text-[#1968D3] hover:bg-blue-50"
                          title="View details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => openEdit({ po, invoice, pendingAmount: Math.max(0, invoice.invoiceAmountWithVat - invoice.paidAmount), isOverdue: ov, isDueSoon: false })}
                          className="flex items-center gap-1 h-7 px-2 rounded text-[11px] font-semibold text-[#6A788D] hover:bg-[#F0F3F8]"
                          title="Edit PO"
                        >
                          <Edit2 size={12} />
                        </button>
                        <Link href={`/purchase-orders/${po.id}`} className="flex items-center gap-1 h-7 px-2 rounded text-[11px] font-semibold text-[#E07B00] hover:bg-orange-50">
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
      <Sheet open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {detailRecord && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2">
                  <FileText size={16} className="text-[#E07B00]" />
                  PO Details
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* PO Info */}
                <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#F8F9FC]">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-3">Purchase Order</div>
                  <div className="space-y-2 text-[12.5px]">
                    {[
                      { label: "PO Reference", value: detailRecord.po.poRef },
                      { label: "Vendor", value: detailRecord.po.vendorName },
                      { label: "Discipline", value: detailRecord.po.discipline },
                      { label: "Initiated By", value: detailRecord.po.initiatedBy },
                      { label: "Date Issued", value: detailRecord.po.dateIssued },
                      { label: "Description", value: detailRecord.po.description },
                      { label: "INCO Term", value: detailRecord.po.incoTerm },
                      { label: "Payment Term", value: detailRecord.po.paymentTerm },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[#6A788D]">{label}</span>
                        <span className="font-semibold text-[#14223B] text-right max-w-[240px]">{value || "—"}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-2">
                      <span className="text-[#6A788D]">PO Amount</span>
                      <span className="font-bold text-[#14223B]">{formatSAR(detailRecord.po.poAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6A788D]">Amount w/ VAT</span>
                      <span className="font-bold text-[#14223B]">{formatSAR(detailRecord.po.amountWithVatSar)}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                {detailRecord.invoice && (
                  <div className="rounded-xl border border-[#E3E8F0] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-3">Linked Invoice</div>
                    <div className="space-y-2 text-[12.5px]">
                      {[
                        { label: "Invoice Ref", value: detailRecord.invoice.invoiceRef },
                        { label: "Invoice Date", value: detailRecord.invoice.invoiceDate },
                        { label: "Invoice Amt w/VAT", value: formatSAR(detailRecord.invoice.invoiceAmountWithVat) },
                        { label: "Paid Amount", value: detailRecord.invoice.paidAmount > 0 ? formatSAR(detailRecord.invoice.paidAmount) : "—" },
                        { label: "Pending", value: detailRecord.pendingAmount > 0 ? formatSAR(detailRecord.pendingAmount) : "—" },
                        { label: "Due Date", value: detailRecord.invoice.dueDate || "—" },
                        { label: "Credit Days", value: `${detailRecord.invoice.creditDays} days` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[#6A788D]">{label}</span>
                          <span className="font-semibold text-[#14223B]">{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-2">
                        <span className="text-[#6A788D]">Payment Status</span>
                        <PaymentStatusBadge status={detailRecord.invoice.paymentStatus} />
                      </div>
                    </div>
                  </div>
                )}

                {detailRecord.po.notes && (
                  <div className="rounded-xl border border-[#E3E8F0] p-4 bg-[#FFFBEB]">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6A788D] mb-1">Notes</div>
                    <p className="text-[12.5px] text-[#14223B]">{detailRecord.po.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openEdit(detailRecord)}>
                    <Edit2 size={13} className="mr-1.5" />Edit PO
                  </Button>
                  <Link href={`/purchase-orders/${detailRecord.po.id}`} className="flex-1">
                    <Button className="w-full text-white" style={{ background: "#E07B00" }}>
                      <ExternalLink size={13} className="mr-1.5" />Full Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit PO Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit PO — {editRecord?.po.poRef}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="grid gap-1.5">
              <Label>Discipline</Label>
              <Select value={editDisc} onValueChange={(v) => setEditDisc(v ?? editDisc)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["TSF", "Safety Equipments", "Consumables", "ELECTRICAL"].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>INCO Term</Label>
                <Input value={editInco} onChange={(e) => setEditInco(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Payment Term</Label>
                <Input value={editPayTerm} onChange={(e) => setEditPayTerm(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditRecord(null)}>Cancel</Button>
              <Button className="flex-1 text-white" style={{ background: "#E07B00" }} onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
