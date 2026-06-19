"use client";

import React from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
import { ClientDataBanner } from "@/components/ui-custom/client-data-banner";
import { ChartCard } from "@/components/ui-custom/chart-card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import {
  AlertTriangle, CheckCircle, Clock, DollarSign, FileText,
  Receipt, ArrowRight, TrendingUp, Database, Calendar, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const ACCENT = "#E07B00";
const SUCCESS = "#1E8E55";
const WARNING = "#C8901F";
const DANGER = "#C0453F";
const INFO = "#1968D3";
const PURPLE = "#7C3AED";
const CHART_COLORS = [ACCENT, INFO, SUCCESS, WARNING, DANGER, PURPLE];

function SARTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E3E8F0] rounded-lg p-3 shadow-lg text-[12px]">
      {label && <div className="font-semibold text-[#14223B] mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[#6A788D]">{p.name}:</span>
          <span className="font-semibold text-[#14223B]">{formatSAR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E8F0] p-4" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11.5px] font-semibold text-[#6A788D] uppercase tracking-wide leading-tight">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none ml-2" style={{ background: `${color ?? ACCENT}18` }}>
          <Icon size={16} style={{ color: color ?? ACCENT }} />
        </div>
      </div>
      <div className="text-[20px] font-bold text-[#14223B] leading-tight">{value}</div>
      {sub && <div className="text-[11.5px] text-[#6A788D] mt-0.5">{sub}</div>}
    </div>
  );
}

function StageChip({ label, count, amount, color }: { label: string; count: number; amount?: number; color: string }) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-[#E3E8F0] p-4 text-center" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
      <div className="text-[24px] font-bold mb-0.5" style={{ color }}>{count}</div>
      <div className="text-[10.5px] font-semibold text-[#6A788D] uppercase tracking-wide">{label}</div>
      {amount !== undefined && <div className="text-[11.5px] font-semibold mt-1 text-[#14223B]">{formatSAR(amount)}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { stats, clientRecords, clientInvoices, clientPOs, clientActivity } = useClientData();
  const { openForm } = useGlobalForms();

  // Action center items
  const overdueRecords = clientRecords.filter((r) => r.isOverdue);
  const dueSoonRecords = clientRecords.filter((r) => r.isDueSoon && !r.isOverdue);
  const hoRecords = clientRecords.filter((r) => r.invoice?.paymentStatus === "Invoice sent to HO");
  const toProcessRecords = clientRecords.filter((r) => r.invoice?.paymentStatus === "To be Processed");
  const missingPayReq = clientRecords.filter((r) => !r.invoice?.paymentRequestedDate && r.invoice?.paymentStatus !== "Paid 100%");

  // Workflow pipeline counts
  const pipelineStages = [
    { label: "PO Issued", count: stats.poCount, color: INFO, amount: stats.totalPoValueWithVat },
    { label: "Invoice Received", count: stats.invoiceCount, color: ACCENT, amount: stats.totalInvoiceValueWithVat },
    { label: "Payment Requested", count: clientInvoices.filter(i => i.paymentRequestedAmount > 0).length, color: WARNING, amount: stats.totalPaymentRequested },
    { label: "Paid", count: stats.paidCount + stats.partiallyPaidCount, color: SUCCESS, amount: stats.totalPaid },
    { label: "Pending", count: stats.invoiceCount - stats.paidCount, color: DANGER, amount: stats.totalPending },
  ];

  // PO value by discipline (dynamic)
  const disciplines = Array.from(new Set(clientPOs.map(p => p.discipline)));
  const disciplineData = disciplines.map((disc) => ({
    name: disc,
    value: clientPOs.filter(po => po.discipline === disc).reduce((s, po) => s + po.amountWithVatSar, 0),
  })).sort((a, b) => b.value - a.value);

  // Payment status pie
  const statusPie = [
    { name: "Paid 100%", value: stats.totalPaid },
    { name: "Invoice sent to HO", value: clientInvoices.filter(i => i.paymentStatus === "Invoice sent to HO").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
    { name: "Partially Paid", value: clientInvoices.filter(i => i.paymentStatus === "Partially Paid").reduce((s, i) => s + i.paidAmount, 0) },
    { name: "To be Processed", value: clientInvoices.filter(i => i.paymentStatus === "To be Processed").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
  ].filter(d => d.value > 0);
  const PIE_COLORS = [SUCCESS, INFO, PURPLE, WARNING];

  // Monthly PO value
  const monthlyMap: Record<string, { poValue: number; paid: number }> = {};
  clientPOs.forEach((po) => {
    if (!po.dateIssued) return;
    const m = po.dateIssued.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { poValue: 0, paid: 0 };
    monthlyMap[m].poValue += po.amountWithVatSar;
  });
  clientInvoices.forEach((inv) => {
    if (!inv.invoiceDate) return;
    const m = inv.invoiceDate.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { poValue: 0, paid: 0 };
    monthlyMap[m].paid += inv.paidAmount;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month: month.slice(5), ...v }));

  return (
    <div className="animate-fade-in-up">
      <ClientDataBanner />

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-[#E3E8F0] p-6 mb-5" style={{ boxShadow: "0 1px 4px rgba(20,34,59,0.05)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase text-white" style={{ background: ACCENT }}>
                <Database size={10} />Client Data Demo
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold text-[#1E8E55] bg-[#ECFDF5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E8E55]" />Live
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-[#14223B] leading-tight">Jeddah Stadium Procurement</h1>
            <p className="text-[13px] text-[#6A788D] mt-1">
              Purchase orders, invoices &amp; payments — imported from Excel trackers · {stats.vendorCount} vendor · {stats.poCount} POs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-[12.5px]" onClick={() => openForm("addInvoice")}>
              <Receipt size={13} />Add Invoice
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-[12.5px]" onClick={() => openForm("recordPayment")}>
              <DollarSign size={13} />Record Payment
            </Button>
            <Button size="sm" className="gap-2 text-[12.5px] text-white" style={{ background: ACCENT }} onClick={() => openForm("addPO")}>
              <FileText size={13} />Create PO
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#F0F3F8]">
          <div className="flex items-center gap-1.5 text-[12px] text-[#6A788D]">
            <Calendar size={13} />
            <span>Imported: <strong className="text-[#14223B]">2026-06-19</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6A788D]">
            <FileText size={13} />
            <span><strong className="text-[#14223B]">{stats.poCount}</strong> Purchase Orders</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6A788D]">
            <Receipt size={13} />
            <span><strong className="text-[#14223B]">{stats.invoiceCount}</strong> Invoices</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6A788D]">
            <CheckCircle size={13} />
            <span>
              <strong className="text-[#1E8E55]">{stats.paidCount}</strong> paid ·{" "}
              <strong className="text-[#C8901F]">{stats.invoiceCount - stats.paidCount}</strong> pending
            </span>
          </div>
          {stats.overdueCount > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#C0453F] font-semibold">
              <AlertTriangle size={13} />
              <span>{stats.overdueCount} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Pipeline KPI Row */}
      <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#6A788D] mb-3">Financial Pipeline — SAR</div>
      <div className="grid grid-cols-3 gap-3.5 mb-3">
        <KpiCard label="Total PO Value (w/ VAT)" value={formatSAR(stats.totalPoValueWithVat)} sub={`${stats.poCount} purchase orders`} icon={FileText} color={INFO} />
        <KpiCard label="Total Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} sub={`${stats.invoiceCount} invoices`} icon={Receipt} color={ACCENT} />
        <KpiCard label="Payment Requested" value={formatSAR(stats.totalPaymentRequested)} sub="Submitted for release" icon={TrendingUp} color={WARNING} />
      </div>
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard label="Total Paid" value={formatSAR(stats.totalPaid)} sub={`${stats.paidCount} invoices fully settled`} icon={CheckCircle} color={SUCCESS} />
        <KpiCard label="Total Pending" value={formatSAR(stats.totalPending)} sub={`${stats.invoiceCount - stats.paidCount} invoices outstanding`} icon={DollarSign} color={WARNING} />
        <KpiCard label="Overdue Amount" value={stats.totalOverdueAmount > 0 ? formatSAR(stats.totalOverdueAmount) : "None"} sub={stats.overdueCount > 0 ? `${stats.overdueCount} invoices past due date` : "All within credit terms"} icon={AlertTriangle} color={stats.overdueCount > 0 ? DANGER : SUCCESS} />
      </div>

      {/* Workflow Pipeline */}
      <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#6A788D] mb-3">Procurement Workflow</div>
      <div className="flex items-stretch gap-2 mb-5">
        {pipelineStages.map((stage, i) => (
          <React.Fragment key={stage.label}>
            <StageChip label={stage.label} count={stage.count} amount={stage.amount} color={stage.color} />
            {i < pipelineStages.length - 1 && (
              <div className="flex items-center text-[#CBD5E1]">
                <ChevronRight size={18} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Action Center + Charts */}
      <div className="grid grid-cols-[1fr_1.6fr] gap-4 mb-4">
        {/* Action Center */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] font-semibold text-[#14223B]">Needs Attention</div>
              <div className="text-[12px] text-[#6A788D] mt-0.5">
                {overdueRecords.length + hoRecords.length + toProcessRecords.length} items
              </div>
            </div>
            <Link href="/invoices" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {overdueRecords.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: "#FFF5F5", borderColor: "#FED7D7" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-[#C0453F]" />
                    <span className="text-[12px] font-semibold text-[#C0453F]">Overdue ({overdueRecords.length})</span>
                  </div>
                  <Link href="/invoices" className="text-[11px] text-[#C0453F] hover:underline font-semibold">View</Link>
                </div>
                <div className="text-[11.5px] text-[#6A788D]">{formatSAR(stats.totalOverdueAmount)} past due</div>
                {overdueRecords.slice(0, 2).map(r => (
                  <div key={r.invoice?.id} className="text-[11px] text-[#14223B] mt-0.5">
                    · {r.invoice?.invoiceRef} — {formatSAR(r.pendingAmount)}
                  </div>
                ))}
              </div>
            )}

            {dueSoonRecords.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} className="text-[#C8901F]" />
                  <span className="text-[12px] font-semibold text-[#C8901F]">Due Soon ({dueSoonRecords.length})</span>
                </div>
                <div className="text-[11.5px] text-[#6A788D]">Within 14 days</div>
              </div>
            )}

            {toProcessRecords.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Receipt size={12} className="text-[#C8901F]" />
                    <span className="text-[12px] font-semibold text-[#C8901F]">To Be Processed ({toProcessRecords.length})</span>
                  </div>
                  <Link href="/invoices" className="text-[11px] text-[#C8901F] hover:underline font-semibold">View</Link>
                </div>
                <div className="text-[11.5px] text-[#6A788D]">
                  {formatSAR(toProcessRecords.reduce((s, r) => s + (r.invoice?.invoiceAmountWithVat ?? 0), 0))} awaiting processing
                </div>
              </div>
            )}

            {hoRecords.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-[#1968D3]" />
                    <span className="text-[12px] font-semibold text-[#1968D3]">Sent to HO ({hoRecords.length})</span>
                  </div>
                  <Link href="/payments" className="text-[11px] text-[#1968D3] hover:underline font-semibold">Record Payment</Link>
                </div>
                <div className="text-[11.5px] text-[#6A788D]">
                  {formatSAR(hoRecords.reduce((s, r) => s + (r.invoice?.invoiceAmountWithVat ?? 0), 0))} awaiting HO release
                </div>
              </div>
            )}

            {missingPayReq.length > 0 && (
              <div className="p-3 rounded-lg border border-[#E3E8F0] bg-[#F8F9FC]">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={12} className="text-[#6A788D]" />
                  <span className="text-[12px] font-semibold text-[#6A788D]">Missing Pay Request ({missingPayReq.length})</span>
                </div>
                <div className="text-[11.5px] text-[#6A788D]">No payment requested date</div>
              </div>
            )}

            {overdueRecords.length === 0 && dueSoonRecords.length === 0 && toProcessRecords.length === 0 && hoRecords.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle size={28} className="mx-auto text-[#1E8E55] mb-2" />
                <div className="text-[13px] font-semibold text-[#14223B]">No urgent items</div>
                <div className="text-[12px] text-[#6A788D]">All invoices are in order</div>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="flex flex-col gap-4">
          <ChartCard title="PO Value by Discipline" subtitle="Amount with VAT per discipline (SAR)">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={disciplineData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<SARTooltip />} />
                <Bar dataKey="value" name="PO Value" radius={[0, 4, 4, 0]}>
                  {disciplineData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Payment Status Breakdown" subtitle="Invoice value by payment status">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatSAR(Number(v))} />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Monthly Chart + Recent Activity */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-4">
        <ChartCard title="Monthly PO Value vs Paid Amount" subtitle="SAR by month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
              <Tooltip content={<SARTooltip />} />
              <Bar dataKey="poValue" name="PO Value" fill={INFO} radius={[3, 3, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill={SUCCESS} radius={[3, 3, 0, 0]} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-[#14223B]">Recent Activity</div>
            <Link href="/data-import" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
              Data Import <ArrowRight size={13} />
            </Link>
          </div>
          {clientActivity.length > 0 ? (
            <div className="flex flex-col gap-3">
              {clientActivity.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className="flex-none mt-1 w-1.5 h-1.5 rounded-full bg-[#E07B00]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#14223B] leading-snug">{act.description}</div>
                    <div className="text-[11px] text-[#6A788D] mt-0.5">
                      {act.performedBy} · {format(new Date(act.timestamp), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-[12.5px] text-[#6A788D] mb-1">No activity yet</div>
              <div className="text-[11.5px] text-[#9AA6B6]">Actions like Mark Paid or Edit will appear here</div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#F0F3F8] flex items-center gap-2">
            <Database size={12} className="text-[#6A788D] flex-none" />
            <div className="text-[11px] text-[#6A788D]">Imported 2026-06-19 · 2 Excel files · 18 POs + 18 invoices</div>
          </div>
        </div>
      </div>

      {/* Quick Invoice Summary Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#14223B]">Invoice Summary</div>
            <div className="text-[12px] text-[#6A788D] mt-0.5">All {stats.invoiceCount} imported invoices</div>
          </div>
          <Link href="/invoices" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
            Manage invoices <ArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E3E8F0]">
                {["Invoice Ref", "PO Ref", "Invoice Date", "Amount w/VAT", "Paid", "Pending", "Due Date", "Status"].map((h) => (
                  <th key={h} className="text-left py-2 pr-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientRecords.slice(0, 8).map(({ po, invoice, pendingAmount, isOverdue: ov }) => (
                <tr key={invoice?.id} className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors ${ov ? "bg-red-50/20" : ""}`}>
                  <td className="py-2.5 pr-4 font-mono text-[12px] font-semibold text-[#14223B]">{invoice?.invoiceRef}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12px] text-[#6A788D]">{po.poRef}</td>
                  <td className="py-2.5 pr-4 text-[#6A788D]">{invoice?.invoiceDate}</td>
                  <td className="py-2.5 pr-4 font-semibold">{formatSAR(invoice?.invoiceAmountWithVat ?? 0)}</td>
                  <td className="py-2.5 pr-4 text-[#1E8E55] font-semibold">{(invoice?.paidAmount ?? 0) > 0 ? formatSAR(invoice!.paidAmount) : "—"}</td>
                  <td className="py-2.5 pr-4 font-semibold" style={{ color: pendingAmount > 0 ? "#C8901F" : "#1E8E55" }}>
                    {pendingAmount > 0 ? formatSAR(pendingAmount) : "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={ov ? "text-[#C0453F] font-semibold" : "text-[#6A788D]"}>{invoice?.dueDate || "—"}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                      style={{ color: getPaymentStatusColor(invoice?.paymentStatus ?? ""), background: getPaymentStatusBg(invoice?.paymentStatus ?? "") }}
                    >
                      {invoice?.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientRecords.length > 8 && (
            <div className="text-center pt-3">
              <Link href="/invoices" className="text-[12px] font-semibold text-[#E07B00] hover:underline">
                View all {clientRecords.length} invoices →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
