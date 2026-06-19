"use client";

import { useApp } from "@/lib/app-context";
import { useClientData } from "@/lib/client-data/client-context";
import { formatPKR, isOverdue, isDueSoon } from "@/lib/store";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { ChartCard } from "@/components/ui-custom/chart-card";
import { PageHeader } from "@/components/ui-custom/page-header";
import { ClientDataBanner } from "@/components/ui-custom/client-data-banner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Package, FileText, Truck, Receipt,
  AlertTriangle, Trash2, Clock, ArrowRight, DollarSign, CheckCircle, Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { clientPOs } from "@/lib/client-data/data";

const ACCENT = "#E07B00";
const SUCCESS = "#1E8E55";
const WARNING = "#C8901F";
const DANGER = "#C0453F";
const INFO = "#1968D3";
const CHART_COLORS = [ACCENT, INFO, SUCCESS, WARNING, DANGER, "#8B5CF6"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E3E8F0] rounded-lg p-3 shadow-lg text-[12px]">
      {label && <div className="font-semibold text-[#14223B] mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[#6A788D]">{p.name}:</span>
          <span className="font-semibold text-[#14223B]">{typeof p.value === "number" && p.value > 10000 ? formatPKR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SARTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E3E8F0] rounded-lg p-3 shadow-lg text-[12px]">
      {label && <div className="font-semibold text-[#14223B] mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[#6A788D]">{p.name}:</span>
          <span className="font-semibold text-[#14223B]">{formatSAR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { state } = useApp();
  const { stats, clientInvoices } = useClientData();

  // KPI calculations
  const totalSpend = state.payments.reduce((s, p) => s + p.amount, 0);
  const pendingPayments = state.invoices
    .filter((inv) => inv.status === "Approved")
    .reduce((s, inv) => s + inv.totalAmount, 0);
  const activePOs = state.purchaseOrders.filter((po) => ["Sent", "Partial"].includes(po.status)).length;

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const deliveriesDueThisWeek = state.deliveries.filter((d) => {
    const exp = new Date(d.expectedDate);
    return d.status !== "Delivered" && exp >= today && exp <= weekEnd;
  }).length;

  const lowStockMaterials = state.materials.filter((m) => m.currentStock <= m.reorderLevel).length;
  const overdueInvoices = state.invoices.filter((inv) => (inv.status === "Pending" || inv.status === "Approved") && isOverdue(inv.dueDate)).length;
  const debrisThisMonth = state.debris.filter((d) => d.removalDate.startsWith("2026-06")).reduce((s, d) => s + d.quantity, 0);
  const delayedVendors = state.deliveries.filter((d) => d.status === "Delayed").length;

  // Chart data: Spend by Category
  const spendByCategory = [
    { name: "Steel", value: 23500000 },
    { name: "Concrete", value: 12800000 },
    { name: "Seating", value: 5000000 },
    { name: "Electrical", value: 2282250 },
    { name: "Lighting", value: 2560000 },
    { name: "Drainage", value: 760000 },
  ];

  // Deliveries by status
  const deliveryStatuses = ["Delivered", "Partial", "Delayed", "Scheduled", "In Transit"];
  const deliveriesByStatus = deliveryStatuses.map((status) => ({
    name: status,
    value: state.deliveries.filter((d) => d.status === status).length,
  })).filter(d => d.value > 0);

  // Paid vs Pending
  const paidTotal = state.invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.totalAmount, 0);
  const pendingTotal = state.invoices.filter((i) => ["Pending", "Approved"].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const overdueTotal = state.invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.totalAmount, 0);
  const pieData = [
    { name: "Paid", value: paidTotal },
    { name: "Pending", value: pendingTotal },
    { name: "Overdue", value: overdueTotal },
  ].filter(d => d.value > 0);
  const PIE_COLORS = [SUCCESS, INFO, DANGER];

  // Inventory health
  const categories = Array.from(new Set(state.materials.map((m) => m.category)));
  const inventoryHealth = categories.map((cat) => {
    const mats = state.materials.filter((m) => m.category === cat);
    const healthPct = Math.round(
      (mats.filter((m) => m.currentStock > m.reorderLevel).length / mats.length) * 100
    );
    return { name: cat, pct: healthPct };
  }).sort((a, b) => a.pct - b.pct);

  // Open alerts
  const openAlerts = state.alerts.filter((a) => a.status === "Open").sort((a, b) => {
    const p: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
  });

  // Recent activity
  const recentActivity = state.activity.slice(0, 6);

  // Phase progress
  const phases = [
    { name: "Foundation", pct: 100, color: SUCCESS },
    { name: "Structural Steel", pct: 68, color: ACCENT },
    { name: "Concrete Works", pct: 55, color: ACCENT },
    { name: "MEP Works", pct: 42, color: WARNING },
    { name: "Seating Installation", pct: 8, color: DANGER },
    { name: "Finishing", pct: 5, color: DANGER },
  ];

  // Client payment status pie
  const clientPaymentPie = [
    { name: "Paid 100%", value: stats.totalPaid },
    { name: "Invoice sent to HO", value: clientInvoices.filter(i => i.paymentStatus === "Invoice sent to HO").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
    { name: "To be Processed", value: clientInvoices.filter(i => i.paymentStatus === "To be Processed").reduce((s, i) => s + i.invoiceAmountWithVat, 0) },
  ].filter(d => d.value > 0);
  const CLIENT_PIE_COLORS = [SUCCESS, INFO, WARNING];

  // PO Value by Discipline
  const disciplines = ["TSF", "Safety Equipments", "Consumables", "ELECTRICAL"];
  const disciplineData = disciplines.map((disc) => ({
    name: disc,
    value: clientPOs.filter(po => po.discipline === disc).reduce((s, po) => s + po.amountWithVatSar, 0),
  })).filter(d => d.value > 0);

  return (
    <div className="animate-fade-in-up">
      <ClientDataBanner />

      <PageHeader
        title="National Stadium Construction"
        subtitle="Inventory, procurement, deliveries, invoices, payments and site activity — one command center."
        badge={<StatusBadge status="Active" />}
        actions={
          <Link href="/purchase-orders">
            <Button style={{ background: ACCENT }} className="text-white hover:opacity-90 gap-2">
              <span>+ New Record</span>
            </Button>
          </Link>
        }
      />

      {/* Client KPI Cards */}
      <div className="mb-2">
        <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#6A788D] mb-3">Client Data — Jeddah Stadium</div>
      </div>
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total PO Value (w/ VAT)" value={formatSAR(stats.totalPoValueWithVat)} subtext="All 18 purchase orders" icon={FileText} variant="info" />
        <StatCard label="Total Invoice Value" value={formatSAR(stats.totalInvoiceValueWithVat)} subtext="18 invoices issued" icon={Receipt} />
        <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} subtext={`${stats.paidCount} invoices paid`} icon={CheckCircle} variant="success" />
        <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} subtext="Unpaid balance" icon={DollarSign} variant="warning" />
        <StatCard label="Paid Invoices" value={`${stats.paidCount} / 18`} subtext="Fully settled" icon={CheckCircle} variant="success" />
        <StatCard label="Invoice Sent to HO" value={String(stats.invoiceSentToHoCount)} subtext="Awaiting HO release" icon={Receipt} variant="info" />
        <StatCard label="To Be Processed" value={String(stats.toBeProcessedCount)} subtext="Not yet submitted" icon={Clock} variant="warning" />
        <StatCard label="Overdue Items" value={String(stats.overdueCount)} subtext="Past due date, unpaid" icon={AlertTriangle} variant={stats.overdueCount > 0 ? "danger" : "success"} />
      </div>

      {/* Client Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <ChartCard title="Payment Status" subtitle="Invoice value by payment status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={clientPaymentPie} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {clientPaymentPie.map((_, i) => <Cell key={i} fill={CLIENT_PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatSAR(Number(v))} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="PO Value by Discipline" subtitle="Amount w/ VAT per discipline" className="col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={disciplineData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<SARTooltip />} />
              <Bar dataKey="value" name="PO Value" radius={[0, 4, 4, 0]}>
                {disciplineData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-[#E3E8F0]" />
        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#6A788D]">Demo Data — National Stadium</span>
        <div className="h-px flex-1 bg-[#E3E8F0]" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Project Spend" value={`PKR ${(totalSpend / 1000000).toFixed(1)}M`} subtext="Paid to date" icon={TrendingUp} variant="success" trend="up" trendValue="On budget" />
        <StatCard label="Pending Payments" value={formatPKR(pendingPayments)} subtext="Awaiting release" icon={Receipt} variant="warning" />
        <StatCard label="Active Purchase Orders" value={String(activePOs)} subtext="Sent + Partial delivery" icon={FileText} variant="info" />
        <StatCard label="Deliveries Due This Week" value={String(deliveriesDueThisWeek)} subtext="Expected by Jun 23" icon={Truck} variant="default" />
        <StatCard label="Low Stock Materials" value={String(lowStockMaterials)} subtext="Below reorder level" icon={Package} variant={lowStockMaterials > 3 ? "danger" : "warning"} />
        <StatCard label="Overdue Invoices" value={String(overdueInvoices)} subtext="Past payment due date" icon={Receipt} variant="danger" />
        <StatCard label="Debris Removed (Jun)" value={`${debrisThisMonth.toFixed(0)} m³`} subtext="This month" icon={Trash2} />
        <StatCard label="Delayed Vendors" value={String(delayedVendors)} subtext="Deliveries overdue" icon={AlertTriangle} variant={delayedVendors > 0 ? "danger" : "success"} />
      </div>

      {/* Row: Alerts + Phase Progress */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-4">
        {/* Critical Alerts */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] font-semibold text-[#14223B]">Critical Alerts</div>
              <div className="text-[12px] text-[#6A788D] mt-0.5">{openAlerts.length} open alerts requiring attention</div>
            </div>
            <Link href="/alerts" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {openAlerts.slice(0, 5).map((alert) => {
              const colors: Record<string, string> = { Critical: DANGER, High: WARNING, Medium: "#C8901F", Low: INFO };
              const color = colors[alert.priority] ?? INFO;
              return (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#F5F7FB] border border-[#E3E8F0]">
                  <div className="flex-none mt-0.5 w-2 h-2 rounded-full" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#14223B] leading-tight">{alert.title}</div>
                    <div className="text-[11.5px] text-[#6A788D] mt-0.5 line-clamp-1">{alert.description}</div>
                  </div>
                  <StatusBadge status={alert.priority} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="text-[14px] font-semibold text-[#14223B] mb-1">Stadium Phase Progress</div>
          <div className="text-[12px] text-[#6A788D] mb-4">Overall construction completion</div>
          <div className="flex flex-col gap-3.5">
            {phases.map((phase) => (
              <div key={phase.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12.5px] font-medium text-[#14223B]">{phase.name}</span>
                  <span className="text-[12px] font-semibold" style={{ color: phase.color }}>{phase.pct}%</span>
                </div>
                <div className="h-[6px] bg-[#F0F3F8] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${phase.pct}%`, background: phase.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Spend by Category */}
        <ChartCard title="Spend by Category" subtitle="Paid invoices by material type" className="col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendByCategory} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Spend" radius={[4, 4, 0, 0]}>
                {spendByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Paid vs Pending */}
        <ChartCard title="Invoice Status" subtitle="Paid vs. pending vs. overdue">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatPKR(Number(v))} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6A788D" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Inventory Health + Delivery Status + Activity */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Inventory Health */}
        <ChartCard title="Inventory Health" subtitle="Stock vs. reorder level by category">
          <div className="flex flex-col gap-3 mt-1">
            {inventoryHealth.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[#14223B]">{item.name}</span>
                  <span className="text-[11.5px] font-semibold" style={{ color: item.pct >= 70 ? SUCCESS : item.pct >= 40 ? WARNING : DANGER }}>{item.pct}%</span>
                </div>
                <div className="h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: item.pct >= 70 ? SUCCESS : item.pct >= 40 ? WARNING : DANGER }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Deliveries by Status */}
        <ChartCard title="Deliveries by Status" subtitle="Current delivery pipeline">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deliveriesByStatus} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6A788D" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {deliveriesByStatus.map((entry) => {
                  const colors: Record<string, string> = { Delivered: SUCCESS, Partial: WARNING, Delayed: DANGER, Scheduled: INFO, "In Transit": "#8B5CF6" };
                  return <Cell key={entry.name} fill={colors[entry.name] ?? ACCENT} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-[#14223B]">Recent Activity</div>
            <Link href="/activity" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentActivity.map((act) => {
              const moduleColors: Record<string, string> = { Invoice: INFO, Delivery: SUCCESS, "Purchase Order": ACCENT, Payment: "#1E8E55", Alert: DANGER, Vendor: WARNING };
              const color = moduleColors[act.module] ?? "#6A788D";
              return (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className="flex-none mt-1 w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#14223B] leading-snug line-clamp-2">{act.description}</div>
                    <div className="text-[11px] text-[#6A788D] mt-0.5">{act.performedBy} · {format(new Date(act.timestamp), "MMM d, h:mm a")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vendors Performance */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#14223B]">Vendor Performance</div>
            <div className="text-[12px] text-[#6A788D] mt-0.5">On-time delivery rates and key metrics</div>
          </div>
          <Link href="/vendors" className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
            View all vendors <ArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E3E8F0]">
                {["Vendor", "Category", "Total PO Value", "Deliveries", "On-Time Rate", "Pending Invoices", "Status"].map((h) => (
                  <th key={h} className="text-left py-2.5 pr-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.vendors.slice(0, 6).map((vendor) => {
                const onTimeRate = vendor.totalDeliveries > 0
                  ? Math.round((vendor.onTimeDeliveries / vendor.totalDeliveries) * 100)
                  : 100;
                return (
                  <tr key={vendor.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/vendors/${vendor.id}`} className="font-semibold text-[#14223B] hover:text-[#E07B00]">{vendor.name}</Link>
                    </td>
                    <td className="py-3 pr-4 text-[#6A788D]">{vendor.category}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ fontFamily: "var(--font-geist-mono)" }}>{formatPKR(vendor.totalPOValue)}</td>
                    <td className="py-3 pr-4">{vendor.onTimeDeliveries}/{vendor.totalDeliveries}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${onTimeRate}%`, background: onTimeRate >= 90 ? SUCCESS : onTimeRate >= 75 ? WARNING : DANGER }} />
                        </div>
                        <span className="font-semibold" style={{ color: onTimeRate >= 90 ? SUCCESS : onTimeRate >= 75 ? WARNING : DANGER }}>{onTimeRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-semibold" style={{ fontFamily: "var(--font-geist-mono)" }}>{formatPKR(vendor.pendingInvoiceAmount)}</td>
                    <td className="py-3"><StatusBadge status={vendor.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
