"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { formatSAR } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { ChartCard } from "@/components/ui-custom/chart-card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#E07B00", "#1968D3", "#1E8E55", "#C8901F", "#C0453F", "#8B5CF6"];
const SUCCESS = "#1E8E55";
const DANGER = "#C0453F";
const WARNING = "#C8901F";
const INFO = "#1968D3";
const ACCENT = "#E07B00";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E3E8F0] rounded-lg p-3 shadow-lg text-[12px]">
      {label && <div className="font-semibold text-[#14223B] mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[#6A788D]">{p.name}:</span>
          <span className="font-semibold text-[#14223B]">{typeof p.value === "number" && p.value > 1000 ? formatSAR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ExportBtn({ label }: { label: string }) {
  return (
    <Button size="sm" variant="outline" className="gap-1.5 text-[12px]" onClick={() => toast.info("Export available in production version")}>
      <Download size={12} />{label}
    </Button>
  );
}

export default function ReportsPage() {
  const { stats, clientInvoices, clientPOs } = useClientData();
  const [mainTab, setMainTab] = useState("client");

  // === CLIENT CHARTS DATA ===
  // Discipline spend — dynamic from imported POs
  const disciplines = Array.from(new Set(clientPOs.map(p => p.discipline)));
  const disciplineSpend = disciplines.map(disc => ({
    name: disc === "Safety Equipments" ? "Safety Equip." : disc,
    value: clientPOs.filter(po => po.discipline === disc).reduce((s, po) => s + po.amountWithVatSar, 0),
  })).sort((a, b) => b.value - a.value);

  const monthlyPO = Object.entries(
    clientPOs.reduce<Record<string, number>>((acc, po) => {
      const m = po.dateIssued.slice(0, 7);
      acc[m] = (acc[m] ?? 0) + po.amountWithVatSar;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month: month.replace("2025-", "").replace("2026-", ""), value }));

  const paidVsPending = [
    { name: "Paid", value: stats.totalPaid },
    { name: "Pending", value: stats.totalPending },
  ];
  const paidVsPendingColors = ["#1E8E55", "#C8901F"];

  const statusBreakdown = [
    { name: "Paid 100%", count: stats.paidCount, value: clientInvoices.filter((i) => i.paymentStatus === "Paid 100%").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
    { name: "Inv. sent to HO", count: stats.invoiceSentToHoCount, value: clientInvoices.filter((i) => i.paymentStatus === "Invoice sent to HO").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
    { name: "To be Processed", count: stats.toBeProcessedCount, value: clientInvoices.filter((i) => i.paymentStatus === "To be Processed").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
  ];
  const statusColors = ["#1E8E55", "#1968D3", "#C8901F"];

  const today2 = new Date();
  const overdueInvoices = clientInvoices.filter((inv) => inv.paymentStatus !== "Paid 100%" && inv.dueDate && new Date(inv.dueDate) < today2).map((inv) => ({
    name: inv.invoiceRef,
    days: Math.ceil((today2.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const reqVsPaid = clientInvoices
    .filter((inv) => inv.paymentRequestedDate)
    .reduce<Record<string, { requested: number; paid: number }>>((acc, inv) => {
      const m = inv.paymentRequestedDate.slice(0, 7);
      if (!acc[m]) acc[m] = { requested: 0, paid: 0 };
      acc[m].requested += inv.paymentRequestedAmount;
      acc[m].paid += inv.paidAmount;
      return acc;
    }, {});
  const reqVsPaidData = Object.entries(reqVsPaid).sort(([a], [b]) => a.localeCompare(b)).map(([m, v]) => ({ month: m.replace("2025-", "").replace("2026-", ""), ...v }));

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Reports"
        subtitle="Jeddah Stadium procurement — spend analysis, payment status, invoice aging."
        actions={<ExportBtn label="Export All" />}
      />

      {mainTab === "client" && (
        <>
          {/* Client Summary */}
          <div className="grid grid-cols-4 gap-3.5 mb-6">
            {[
              { label: "Total PO Value w/VAT", value: formatSAR(stats.totalPoValueWithVat), color: "#14223B" },
              { label: "Total Paid", value: formatSAR(stats.totalPaid), color: "#1E8E55" },
              { label: "Total Pending", value: formatSAR(stats.totalPending), color: "#C8901F" },
              { label: "Overdue Items", value: String(stats.overdueCount), color: "#C0453F" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-[#E3E8F0] p-4" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
                <div className="text-[11.5px] font-semibold text-[#6A788D] uppercase tracking-[0.05em] mb-2">{item.label}</div>
                <div className="text-[20px] font-bold" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* PO Value by Discipline */}
            <ChartCard title="PO Value by Discipline" subtitle="Total PO amount with VAT (SAR)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={disciplineSpend} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatSAR(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => formatSAR(Number(v ?? 0))} />
                  <Bar dataKey="value" name="PO Value" radius={[0, 4, 4, 0]}>
                    {disciplineSpend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Paid vs Pending */}
            <ChartCard title="Paid vs Pending Amount" subtitle="Invoice value breakdown by payment status">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paidVsPending} cx="50%" cy="45%" outerRadius={85} paddingAngle={3} dataKey="value">
                    {paidVsPending.map((_, i) => <Cell key={i} fill={paidVsPendingColors[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatSAR(Number(v ?? 0))} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Monthly PO Trend */}
            <ChartCard title="Monthly PO Value" subtitle="PO value issued per month (SAR w/VAT)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyPO}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => formatSAR(Number(v ?? 0))} />
                  <Bar dataKey="value" name="PO Value" fill={ACCENT} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Payment Status Breakdown */}
            <ChartCard title="Invoice Amount by Status" subtitle="Total invoice value per payment status">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusBreakdown}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6A788D" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => formatSAR(Number(v ?? 0))} />
                  <Bar dataKey="value" name="Invoice Amount" radius={[4, 4, 0, 0]}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* Invoice Aging — overdue items */}
            <ChartCard title="Invoice Aging (Overdue)" subtitle="Days past due date for unpaid invoices">
              {overdueInvoices.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-[13px] text-[#6A788D]">No overdue invoices</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={overdueInvoices} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6A788D" }} axisLine={false} tickLine={false} width={85} />
                    <Tooltip formatter={(v) => `${v} days`} />
                    <Bar dataKey="days" name="Days Overdue" fill={DANGER} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Payment Requested vs Paid */}
            <ChartCard title="Payment Requested vs Paid" subtitle="Monthly comparison (SAR)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reqVsPaidData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => formatSAR(Number(v ?? 0))} />
                  <Bar dataKey="requested" name="Requested" fill={INFO} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="paid" name="Paid" fill={SUCCESS} radius={[2, 2, 0, 0]} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

    </div>
  );
}
