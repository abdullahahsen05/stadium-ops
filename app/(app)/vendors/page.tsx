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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Plus, ExternalLink, Package, Receipt } from "lucide-react";
import Link from "next/link";

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}>
      {status}
    </span>
  );
}

export default function VendorsPage() {
  const { clientPOs, clientInvoices, clientVendors, stats } = useClientData();
  const { openForm } = useGlobalForms();

  const [search, setSearch] = useState("");

  // Build vendor summary from client POs + invoices
  const vendorMap = new Map<string, {
    name: string;
    discipline: string;
    poCount: number;
    totalPOValue: number;
    invoiceCount: number;
    totalInvoiceValue: number;
    totalPaid: number;
    pendingAmount: number;
    latestStatus: string;
    isNew: boolean;
  }>();

  // From POs
  for (const po of clientPOs) {
    const existing = vendorMap.get(po.vendorName);
    if (existing) {
      existing.poCount += 1;
      existing.totalPOValue += po.amountWithVatSar;
    } else {
      vendorMap.set(po.vendorName, {
        name: po.vendorName,
        discipline: po.discipline,
        poCount: 1,
        totalPOValue: po.amountWithVatSar,
        invoiceCount: 0,
        totalInvoiceValue: 0,
        totalPaid: 0,
        pendingAmount: 0,
        latestStatus: "",
        isNew: false,
      });
    }
  }

  // From invoices
  for (const inv of clientInvoices) {
    const existing = vendorMap.get(inv.vendorName);
    if (existing) {
      existing.invoiceCount += 1;
      existing.totalInvoiceValue += inv.invoiceAmountWithVat;
      existing.totalPaid += inv.paidAmount;
      existing.pendingAmount += Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount);
      if (!existing.latestStatus || inv.paymentStatus === "Paid 100%") existing.latestStatus = inv.paymentStatus;
    }
  }

  // From new client vendors (not yet in POs)
  for (const v of clientVendors) {
    if (!vendorMap.has(v.name)) {
      vendorMap.set(v.name, {
        name: v.name,
        discipline: v.category,
        poCount: 0,
        totalPOValue: 0,
        invoiceCount: 0,
        totalInvoiceValue: 0,
        totalPaid: 0,
        pendingAmount: 0,
        latestStatus: "",
        isNew: true,
      });
    }
  }

  const allVendors = Array.from(vendorMap.values()).sort((a, b) => b.totalPOValue - a.totalPOValue);

  const filtered = allVendors.filter((v) =>
    search === "" ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.discipline.toLowerCase().includes(search.toLowerCase())
  );

  const latestInvoiceDate = clientInvoices.reduce((latest, inv) => inv.invoiceDate > latest ? inv.invoiceDate : latest, "");
  const statusBreakdown = [
    { label: "Paid 100%", count: stats.paidCount, color: "#1E8E55", bg: "#ECFDF5" },
    { label: "Invoice sent to HO", count: stats.invoiceSentToHoCount, color: "#1968D3", bg: "#EFF6FF" },
    { label: "To be Processed", count: stats.toBeProcessedCount, color: "#C8901F", bg: "#FFFBEB" },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Client Vendor Summary Card */}
      <div className="mb-6 rounded-xl border border-[#E07B00]/30 overflow-hidden" style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFFDF9 100%)", boxShadow: "0 1px 4px rgba(224,123,0,0.08)" }}>
        <div className="px-6 py-4 border-b border-[#E07B00]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[14px]" style={{ background: "#E07B00" }}>AZ</div>
            <div>
              <div className="font-bold text-[#14223B] text-[15px]">AZRAQ AL BAHAR TRADING</div>
              <div className="text-[12px] text-[#6A788D]">Primary Vendor · Jeddah Stadium 2034 · All disciplines</div>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: "#1E8E55" }}>Active</span>
        </div>
        <div className="px-6 py-4 grid grid-cols-4 gap-6">
          <div>
            <div className="text-[11px] text-[#6A788D] font-medium mb-0.5">Total POs</div>
            <div className="text-[22px] font-bold text-[#14223B]">{stats.poCount}</div>
            <div className="text-[11px] text-[#6A788D]">Avg credit: {stats.avgCreditDays} days</div>
          </div>
          <div>
            <div className="text-[11px] text-[#6A788D] font-medium mb-0.5">Total PO Value w/VAT</div>
            <div className="text-[18px] font-bold text-[#14223B]">{formatSAR(stats.totalPoValueWithVat)}</div>
            <div className="text-[11px] text-[#6A788D]">Invoice value: {formatSAR(stats.totalInvoiceValueWithVat)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#6A788D] font-medium mb-0.5">Total Paid</div>
            <div className="text-[18px] font-bold text-[#1E8E55]">{formatSAR(stats.totalPaid)}</div>
            <div className="text-[11px] text-[#6A788D]">Pending: {formatSAR(stats.totalPending)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#6A788D] font-medium mb-0.5">Latest Invoice</div>
            <div className="text-[16px] font-bold text-[#14223B]">{latestInvoiceDate || "—"}</div>
            <div className="text-[11px] text-[#6A788D]">Overdue items: {stats.overdueCount}</div>
          </div>
        </div>
        <div className="px-6 pb-4 flex items-center gap-2">
          {statusBreakdown.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold" style={{ color: s.color, background: s.bg }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.count} {s.label}
            </span>
          ))}
        </div>
      </div>

      <PageHeader
        title="Vendors"
        subtitle="Vendors derived from Jeddah Stadium procurement POs and invoices."
        actions={
          <Button
            onClick={() => openForm("addVendor")}
            className="gap-2 text-white text-[12.5px]"
            style={{ background: "#E07B00" }}
          >
            <Plus size={14} />Add Vendor
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Vendors" value={String(allVendors.length)} icon={Building2} />
        <StatCard label="Total PO Value" value={formatSAR(stats.totalPoValueWithVat)} icon={Package} variant="info" />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} icon={Building2} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} icon={Building2} variant="warning" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} vendors</div>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No vendors found" description="Add a vendor or it will appear once a PO is created." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-[#F8F9FC]">
                <tr className="border-b border-[#E3E8F0]">
                  {["Vendor Name", "Discipline", "POs", "Total PO Value", "Invoices", "Invoice Value", "Paid", "Pending", "Latest Status", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor) => (
                  <tr key={vendor.name} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#14223B]">
                      {vendor.name}
                      {vendor.isNew && (
                        <span className="ml-1.5 text-[10px] font-bold bg-[#EFF6FF] text-[#1968D3] px-1.5 py-0.5 rounded">NEW</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#6A788D]">{vendor.discipline}</td>
                    <td className="py-3 px-4 font-semibold text-center">{vendor.poCount}</td>
                    <td className="py-3 px-4 font-semibold font-mono">{vendor.totalPOValue > 0 ? formatSAR(vendor.totalPOValue) : "—"}</td>
                    <td className="py-3 px-4 font-semibold text-center">{vendor.invoiceCount}</td>
                    <td className="py-3 px-4 font-mono">{vendor.totalInvoiceValue > 0 ? formatSAR(vendor.totalInvoiceValue) : "—"}</td>
                    <td className="py-3 px-4 font-mono text-[#1E8E55] font-semibold">{vendor.totalPaid > 0 ? formatSAR(vendor.totalPaid) : "—"}</td>
                    <td className="py-3 px-4 font-mono" style={{ color: vendor.pendingAmount > 0 ? "#C8901F" : "#6A788D" }}>
                      {vendor.pendingAmount > 0 ? formatSAR(vendor.pendingAmount) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {vendor.latestStatus
                        ? <PaymentStatusBadge status={vendor.latestStatus} />
                        : <span className="text-[11px] text-[#9AA6B6]">No invoices</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openForm("addInvoice", { vendorName: vendor.name })}
                          className="h-7 px-2 flex items-center gap-1 rounded text-[11px] font-semibold text-[#E07B00] hover:bg-orange-50"
                          title="Add invoice for this vendor"
                        >
                          <Receipt size={11} />Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
