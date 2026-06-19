"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { importSummary } from "@/lib/client-data/import-summary";
import { formatSAR, isOverdue, isDueSoon } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { ClientDataBanner } from "@/components/ui-custom/client-data-banner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Info,
  Building2, FileText, Receipt, Link2, Clock, Database,
} from "lucide-react";

function SummaryRow({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F0F3F8] last:border-0">
      <span className="text-[13px] text-[#6A788D]">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: valueColor ?? "#14223B" }}>{value}</span>
    </div>
  );
}

function QualityRow({ type, text }: { type: "warning" | "info" | "ok"; text: string }) {
  const styles = {
    warning: { bg: "#FFF8F0", border: "#E07B00", icon: <AlertTriangle size={13} className="text-[#E07B00] flex-none" />, badge: { bg: "#FEF3C7", color: "#92400E", label: "Overdue" } },
    info: { bg: "#EFF6FF", border: "#1968D3", icon: <Info size={13} className="text-[#1968D3] flex-none" />, badge: { bg: "#DBEAFE", color: "#1E40AF", label: "Attention" } },
    ok: { bg: "#ECFDF5", border: "#1E8E55", icon: <CheckCircle2 size={13} className="text-[#1E8E55] flex-none" />, badge: { bg: "#D1FAE5", color: "#065F46", label: "OK" } },
  }[type];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1.5" style={{ background: styles.bg, borderLeft: `3px solid ${styles.border}` }}>
      {styles.icon}
      <span className="text-[12.5px] text-[#14223B] flex-1">{text}</span>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold" style={{ background: styles.badge.bg, color: styles.badge.color }}>
        {styles.badge.label}
      </span>
    </div>
  );
}

export default function DataImportPage() {
  const { clientInvoices, stats } = useClientData();
  const [uploadOpen, setUploadOpen] = useState(false);
  const today = new Date();

  const overdueItems = clientInvoices.filter(
    (inv) => inv.paymentStatus !== "Paid 100%" && inv.dueDate && new Date(inv.dueDate) < today
  );
  const dueSoonItems = clientInvoices.filter(
    (inv) => inv.paymentStatus !== "Paid 100%" && isDueSoon(inv.dueDate, 14) && !isOverdue(inv.dueDate)
  );
  const missingPayReq = clientInvoices.filter((inv) => !inv.paymentRequestedDate && inv.paymentStatus !== "To be Processed");

  return (
    <div className="animate-fade-in-up">
      <ClientDataBanner />
      <PageHeader
        title="Data Import"
        subtitle="Excel tracker records imported for the Jeddah Stadium client demo."
        actions={
          <Button onClick={() => setUploadOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Upload size={14} />Upload Excel / CSV
          </Button>
        }
      />

      {/* Confidentiality notice */}
      <div className="mb-5 flex items-start gap-3 p-4 rounded-xl text-[12.5px]" style={{ background: "#FFF8F0", border: "1px solid rgba(224,123,0,0.25)" }}>
        <Database size={15} className="text-[#E07B00] flex-none mt-0.5" />
        <div>
          <span className="font-semibold text-[#14223B]">Confidentiality Notice:</span>{" "}
          <span className="text-[#6A788D]">This demo uses data provided by the client for review purposes only. Do not share the demo link publicly. Raw Excel files are not committed to the repository.</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Import Summary */}
        <div className="col-span-2 bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="px-5 py-4 border-b border-[#F0F3F8] flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#E07B00]" />
            <span className="font-semibold text-[14px] text-[#14223B]">Import Summary</span>
            <span className="ml-auto text-[11.5px] text-[#6A788D]">Imported: {importSummary.importDate}</span>
          </div>
          <div className="px-5 py-1">
            {importSummary.files.map((f) => (
              <div key={f.name} className="flex items-center gap-3 py-3 border-b border-[#F0F3F8]">
                <FileSpreadsheet size={15} className="text-[#1E8E55] flex-none" />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#14223B]">{f.name}</div>
                  <div className="text-[11.5px] text-[#6A788D]">Sheet: {f.sheet} · {f.rowsProcessed} rows processed</div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: "#1E8E55" }}>
                  <CheckCircle2 size={10} />Imported
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3">
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <SummaryRow label="Purchase Orders Detected" value={importSummary.purchaseOrdersDetected} />
                <SummaryRow label="Invoices Detected" value={importSummary.invoicesDetected} />
                <SummaryRow label="Vendors Detected" value={importSummary.vendorsDetected} />
                <SummaryRow label="Linked PO / Invoice Matches" value={importSummary.linkedMatches} valueColor="#1E8E55" />
              </div>
              <div>
                <SummaryRow label="Unmatched POs" value={importSummary.unmatchedPOs} valueColor={importSummary.unmatchedPOs > 0 ? "#C0453F" : "#1E8E55"} />
                <SummaryRow label="Unmatched Invoices" value={importSummary.unmatchedInvoices} valueColor={importSummary.unmatchedInvoices > 0 ? "#C0453F" : "#1E8E55"} />
                <SummaryRow label="Missing Payment Req. Date" value={importSummary.missingDates} valueColor="#C8901F" />
                <SummaryRow label="Records Pending Payment" value={importSummary.recordsPending} valueColor="#C8901F" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-3">
          {[
            { icon: FileText, label: "Total PO Value w/VAT", value: formatSAR(stats.totalPoValueWithVat), color: "#14223B" },
            { icon: CheckCircle2, label: "Total Paid", value: formatSAR(stats.totalPaid), color: "#1E8E55" },
            { icon: Clock, label: "Total Pending", value: formatSAR(stats.totalPending), color: "#C8901F" },
            { icon: AlertTriangle, label: "Overdue Items", value: String(stats.overdueCount), color: "#C0453F" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-[#E3E8F0] p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none" style={{ background: `${item.color}15` }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div>
                <div className="text-[11px] text-[#6A788D] font-medium">{item.label}</div>
                <div className="text-[16px] font-bold" style={{ color: item.color }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Quality */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden mb-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        <div className="px-5 py-4 border-b border-[#F0F3F8] flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#C8901F]" />
          <span className="font-semibold text-[14px] text-[#14223B]">Data Quality Notes</span>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold text-white" style={{ background: "#C8901F" }}>
            {overdueItems.length + dueSoonItems.length + missingPayReq.length} items
          </span>
        </div>
        <div className="px-5 py-4">
          {overdueItems.map((inv) => (
            <QualityRow
              key={inv.id}
              type="warning"
              text={`${inv.invoiceRef} (${inv.poRef}) — ${inv.paymentStatus}, due ${inv.dueDate} (${Math.ceil((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue)`}
            />
          ))}
          {dueSoonItems.map((inv) => (
            <QualityRow
              key={inv.id}
              type="info"
              text={`${inv.invoiceRef} (${inv.poRef}) — ${inv.paymentStatus}, due ${inv.dueDate} (due soon)`}
            />
          ))}
          {missingPayReq.map((inv) => (
            <QualityRow
              key={inv.id}
              type="info"
              text={`${inv.invoiceRef} (${inv.poRef}) — No payment requested date recorded`}
            />
          ))}
          {overdueItems.length === 0 && dueSoonItems.length === 0 && missingPayReq.length === 0 && (
            <QualityRow type="ok" text="All records are complete and up to date." />
          )}
        </div>
      </div>

      {/* Invoice records table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        <div className="px-5 py-4 border-b border-[#F0F3F8] flex items-center gap-2">
          <Receipt size={16} className="text-[#E07B00]" />
          <span className="font-semibold text-[14px] text-[#14223B]">Imported Invoice Records</span>
          <span className="ml-auto text-[12px] text-[#6A788D]">{clientInvoices.length} records</span>
        </div>
        <table className="w-full text-[12px]">
          <thead className="bg-[#F8F9FC]">
            <tr className="border-b border-[#E3E8F0]">
              {["#", "PO Ref", "Invoice Ref", "Invoice Date", "Amount w/VAT", "Due Date", "Status"].map((h) => (
                <th key={h} className="text-left py-2.5 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientInvoices.map((inv) => {
              const ov = isOverdue(inv.dueDate) && inv.paymentStatus !== "Paid 100%";
              const ds = isDueSoon(inv.dueDate) && !ov && inv.paymentStatus !== "Paid 100%";
              const statusColor =
                inv.paymentStatus === "Paid 100%" ? "#1E8E55" :
                inv.paymentStatus === "Invoice sent to HO" ? "#1968D3" : "#C8901F";
              const statusBg =
                inv.paymentStatus === "Paid 100%" ? "#ECFDF5" :
                inv.paymentStatus === "Invoice sent to HO" ? "#EFF6FF" : "#FFFBEB";
              return (
                <tr key={inv.id} className={`border-b border-[#F0F3F8] ${ov ? "bg-red-50/30" : ds ? "bg-amber-50/20" : ""}`}>
                  <td className="py-2.5 px-4 text-[#6A788D]">{inv.sl}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#6A788D]">{inv.poRef}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-[#14223B]">{inv.invoiceRef}</td>
                  <td className="py-2.5 px-4 text-[#6A788D]">{inv.invoiceDate}</td>
                  <td className="py-2.5 px-4 font-semibold font-mono text-[11px]">{formatSAR(inv.invoiceAmountWithVat)}</td>
                  <td className="py-2.5 px-4" style={{ color: ov ? "#C0453F" : ds ? "#C8901F" : "#6A788D" }}>
                    {inv.dueDate}{ov ? " ⚠" : ds ? " ⏰" : ""}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold" style={{ color: statusColor, background: statusBg }}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Upload Sheet */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Upload Excel / CSV</SheetTitle>
          </SheetHeader>

          {/* Upload area */}
          <div className="border-2 border-dashed border-[#E3E8F0] rounded-xl p-8 flex flex-col items-center justify-center gap-3 mb-5 bg-[#F8F9FC] hover:border-[#E07B00]/40 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FFF0E0" }}>
              <Upload size={22} className="text-[#E07B00]" />
            </div>
            <div className="text-center">
              <div className="text-[14px] font-semibold text-[#14223B]">Drop your Excel or CSV file here</div>
              <div className="text-[12px] text-[#6A788D] mt-1">or click to browse — .xlsx, .xls, .csv supported</div>
            </div>
          </div>

          <div className="p-4 rounded-xl text-[12.5px] mb-5" style={{ background: "#FFF8F0", border: "1px solid rgba(224,123,0,0.2)" }}>
            <div className="font-semibold text-[#E07B00] mb-1">Demo Preview Only</div>
            <div className="text-[#6A788D] leading-relaxed">In production, uploaded files will be validated against the expected column schema, normalized, and imported into the database. New records will be merged with existing tracker data.</div>
          </div>

          {/* Mock import preview */}
          <div className="mb-5">
            <div className="text-[12px] font-semibold text-[#6A788D] uppercase tracking-wider mb-2">Mock Import Preview (Current Data)</div>
            <div className="bg-white rounded-lg border border-[#E3E8F0] overflow-hidden text-[11.5px]">
              <table className="w-full">
                <thead className="bg-[#F8F9FC]">
                  <tr className="border-b border-[#E3E8F0]">
                    <th className="text-left py-2 px-3 font-semibold text-[#6A788D]">PO Ref</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#6A788D]">Vendor</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#6A788D]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientInvoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="border-b border-[#F0F3F8]">
                      <td className="py-2 px-3 font-mono text-[10.5px]">{inv.poRef}</td>
                      <td className="py-2 px-3 text-[#6A788D]">AZRAQ AL BAHAR</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{
                          color: inv.paymentStatus === "Paid 100%" ? "#1E8E55" : "#C8901F",
                          background: inv.paymentStatus === "Paid 100%" ? "#ECFDF5" : "#FFFBEB",
                        }}>{inv.paymentStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-center py-2 text-[11px] text-[#6A788D]">+ {clientInvoices.length - 5} more records</div>
            </div>
          </div>

          <Button className="w-full text-white" style={{ background: "#E07B00" }} onClick={() => { setUploadOpen(false); }}>
            Close Preview
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
