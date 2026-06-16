"use client";

import { useApp } from "@/lib/app-context";
import { formatPKR } from "@/lib/store";
import { PageHeader } from "@/components/ui-custom/page-header";
import { ChartCard } from "@/components/ui-custom/chart-card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { Download, BarChart3 } from "lucide-react";
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

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Reports"
        subtitle="Management reporting — spend analysis, delivery performance, invoice aging."
        actions={<ExportBtn label="Export All" />}
      />

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
    </div>
  );
}
