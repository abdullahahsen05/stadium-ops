"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { useClientData } from "@/lib/client-data/client-context";
import { formatPKR } from "@/lib/store";
import { formatSAR } from "@/lib/client-data/utils";
import { clientPOs, clientInvoices as baseClientInvoices } from "@/lib/client-data/data";
import { PageHeader } from "@/components/ui-custom/page-header";
import { ChartCard } from "@/components/ui-custom/chart-card";
import { ClientDataBanner } from "@/components/ui-custom/client-data-banner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <span className="font-semibold text-[#14223B]">{typeof p.value === "number" && p.value > 100000 ? formatPKR(p.value) : p.value}</span>
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
  const { state } = useApp();
  const { stats, clientInvoices } = useClientData();
  const [mainTab, setMainTab] = useState("client");

  // Spend by vendor
  const spendByVendor = state.vendors
    .map((v) => ({ name: v.name.split(" ").slice(0, 2).join(" "), value: state.payments.filter((p) => p.vendorId === v.id).reduce((s, p) => s + p.amount, 0) }))
    .filter((v) => v.value > 0)
    .sort((a, b) => b.value - a.value);

  // Spend by category
  const spendByCategory = [
    { name: "Steel", value: 23500000 },
    { name: "Concrete", value: 12800000 },
    { name: "Seating", value: 5000000 },
    { name: "Electrical", value: 2282250 },
    { name: "Lighting", value: 2560000 },
    { name: "Drainage", value: 760000 },
    { name: "Glass", value: 0 },
  ].filter((c) => c.value > 0);

  // Invoice aging
  const today = new Date();
  const aging = [
    { name: "0–5 days", count: 0 }, { name: "6–10 days", count: 0 },
    { name: "Due Soon", count: 0 }, { name: "Overdue", count: 0 },
  ];
  state.invoices.filter((i) => ["Pending", "Approved"].includes(i.status)).forEach((inv) => {
    const dueDate = new Date(inv.dueDate);
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) aging[3].count++;
    else if (diff <= 3) aging[2].count++;
    else if (diff <= 5) aging[0].count++;
    else aging[1].count++;
  });

  // Delivery perf by vendor
  const deliveryPerf = state.vendors
    .filter((v) => v.totalDeliveries > 0)
    .map((v) => ({
      name: v.name.split(" ").slice(0, 2).join(" "),
      onTime: v.onTimeDeliveries,
      delayed: v.totalDeliveries - v.onTimeDeliveries,
    }));

  // Debris cost by month (mock trend)
  const debrisTrend = [
    { month: "Feb", cost: 45000 }, { month: "Mar", cost: 78000 },
    { month: "Apr", cost: 110000 }, { month: "May", cost: 185000 },
    { month: "Jun", cost: state.debris.filter((d) => d.removalDate.startsWith("2026-06")).reduce((s, d) => s + d.cost, 0) },
  ];

  const totalPaid = state.payments.reduce((s, p) => s + p.amount, 0);
  const totalPending = state.invoices.filter((i) => ["Pending", "Approved"].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const totalDebrisCost = state.debris.reduce((s, d) => s + d.cost, 0);

  // === CLIENT CHARTS DATA ===
  const disciplineSpend = [
    { name: "Consumables", value: 0 },
    { name: "TSF", value: 0 },
    { name: "Safety Equip.", value: 0 },
    { name: "Electrical", value: 0 },
  ];
  clientPOs.forEach((po) => {
    const bucket = disciplineSpend.find((d) =>
      (d.name === "Consumables" && po.discipline === "Consumables") ||
      (d.name === "TSF" && po.discipline === "TSF") ||
      (d.name === "Safety Equip." && po.discipline === "Safety Equipments") ||
      (d.name === "Electrical" && po.discipline === "ELECTRICAL")
    );
    if (bucket) bucket.value += po.amountWithVatSar;
  });

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
      <ClientDataBanner />
      <PageHeader
        title="Reports"
        subtitle="Management reporting — spend analysis, delivery performance, invoice aging."
        actions={<ExportBtn label="Export All" />}
      />

      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="client">Client Reports</TabsTrigger>
          <TabsTrigger value="demo">Demo Reports</TabsTrigger>
        </TabsList>
      </Tabs>

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

      {mainTab === "demo" && (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-4 gap-3.5 mb-6">
            {[
              { label: "Total Project Spend", value: formatPKR(totalPaid), color: "#1E8E55" },
              { label: "Pending Payments", value: formatPKR(totalPending), color: "#C8901F" },
              { label: "Debris Removal Cost", value: formatPKR(totalDebrisCost), color: "#6A788D" },
              { label: "Active Vendors", value: String(state.vendors.filter((v) => v.status === "Active").length), color: "#1968D3" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-[#E3E8F0] p-4" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
                <div className="text-[11.5px] font-semibold text-[#6A788D] uppercase tracking-[0.05em] mb-2">{item.label}</div>
                <div className="text-[22px] font-bold" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Spend by Vendor */}
        <ChartCard title="Spend by Vendor" subtitle="Total paid amount per vendor" actions={<ExportBtn label="Export CSV" />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={spendByVendor} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Paid" radius={[0, 4, 4, 0]}>
                {spendByVendor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Spend by Category */}
        <ChartCard title="Spend by Material Category" subtitle="Procurement spend distribution" actions={<ExportBtn label="Export" />}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={spendByCategory} cx="50%" cy="45%" outerRadius={90} paddingAngle={2} dataKey="value">
                {spendByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatPKR(Number(value ?? 0))} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Invoice Aging */}
        <ChartCard title="Invoice Aging" subtitle="Open invoices by days to due date" actions={<ExportBtn label="Export" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={aging}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Invoices" radius={[4, 4, 0, 0]}>
                {aging.map((entry, i) => {
                  const colors = ["#1968D3", "#1E8E55", "#C8901F", "#C0453F"];
                  return <Cell key={i} fill={colors[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Vendor Delivery Performance */}
        <ChartCard title="Vendor Delivery Performance" subtitle="On-time vs. delayed deliveries" actions={<ExportBtn label="Export" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deliveryPerf}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="onTime" name="On Time" fill={SUCCESS} radius={[2, 2, 0, 0]} />
              <Bar dataKey="delayed" name="Delayed" fill={DANGER} radius={[2, 2, 0, 0]} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Debris Trend */}
        <ChartCard title="Debris Removal Cost Trend" subtitle="Monthly waste management expenditure" actions={<ExportBtn label="Export" />}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={debrisTrend}>
              <CartesianGrid stroke="#F0F3F8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="cost" name="Debris Cost" stroke={WARNING} strokeWidth={2.5} dot={{ fill: WARNING, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        </>
      )}
    </div>
  );
}
