"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { formatPKR, generateId } from "@/lib/store";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
import type { DebrisRecord, DebrisType, DisposalStatus, Zone } from "@/lib/types";

const zones: Zone[] = ["North Stand", "South Stand", "East Stand", "West Stand", "VIP Pavilion", "Player Tunnel", "Main Pitch", "Parking Area", "Floodlight Zone", "Drainage Zone", "Concourse Level", "Media Box"];
const debrisTypes: DebrisType[] = ["Concrete Waste", "Steel Scrap", "Mixed Construction Waste", "Soil", "Formwork Timber", "Packaging", "Hazardous", "Electrical Waste"];

const debrisSchema = z.object({
  type: z.string().min(1, "Type required"),
  quantity: z.number().min(0.1),
  unit: z.string().min(1, "Unit required"),
  zone: z.string().min(1, "Zone required"),
  removalVendor: z.string().min(1, "Vendor required"),
  removalDate: z.string().min(1, "Date required"),
  cost: z.number().min(0),
  disposalStatus: z.enum(["Pending", "Scheduled", "Removed", "Disposed"]),
  notes: z.string().optional(),
});
type DebrisForm = z.infer<typeof debrisSchema>;

export default function DebrisPage() {
  const { state, addDebris, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DebrisForm>({
    resolver: zodResolver(debrisSchema),
    defaultValues: { disposalStatus: "Pending" },
  });

  const filtered = state.debris.filter((d) =>
    d.debrisNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    d.zone.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = state.debris.reduce((s, d) => s + d.cost, 0);
  const thisMonth = state.debris.filter((d) => d.removalDate.startsWith("2026-06")).reduce((s, d) => s + d.quantity, 0);
  const pending = state.debris.filter((d) => d.disposalStatus === "Pending").length;
  const disposed = state.debris.filter((d) => d.disposalStatus === "Disposed").length;

  function onSubmit(data: DebrisForm) {
    const debrisNumber = `DBR-2026-${String(state.debris.length + 1).padStart(3, "0")}`;
    const newRecord: DebrisRecord = {
      id: generateId("dbr"),
      debrisNumber,
      type: data.type as DebrisType,
      quantity: Number(data.quantity),
      unit: data.unit,
      zone: data.zone as Zone,
      removalVendor: data.removalVendor,
      removalDate: data.removalDate,
      cost: Number(data.cost),
      disposalStatus: data.disposalStatus as DisposalStatus,
      notes: data.notes ?? "",
    };
    addDebris(newRecord);
    addActivity({ module: "Debris", action: "created", description: `Logged ${data.type} removal from ${data.zone} â€” ${data.quantity} ${data.unit}`, referenceId: newRecord.id, referenceNumber: debrisNumber, performedBy: "Ali Khan", role: "Site Engineer" });
    toast.success(`Debris record ${debrisNumber} added`);
    reset();
    setAddOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Debris / Waste"
        subtitle="Track debris removal, disposal status, and waste management costs."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Plus size={14} />Add Debris Record
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Removal Cost" value={formatPKR(totalCost)} icon={Trash2} variant="warning" />
        <StatCard label="Volume This Month" value={`${thisMonth.toFixed(0)} mÂ³`} subtext="June 2026" icon={Trash2} />
        <StatCard label="Pending Disposal" value={String(pending)} subtext="Awaiting removal" icon={Trash2} variant="danger" />
        <StatCard label="Disposed" value={String(disposed)} icon={Trash2} variant="success" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search debris records..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} records</div>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Trash2} title="No debris records found" />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Record #", "Type", "Quantity", "Zone", "Removal Vendor", "Removal Date", "Cost", "Status", "Notes"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                  <td className="py-3 px-4 font-mono-id text-[#6A788D]">{d.debrisNumber}</td>
                  <td className="py-3 px-4 font-medium text-[#14223B]">{d.type}</td>
                  <td className="py-3 px-4 font-mono-id">{d.quantity} {d.unit}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{d.zone}</td>
                  <td className="py-3 px-4 text-[#14223B]">{d.removalVendor}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{d.removalDate}</td>
                  <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(d.cost)}</td>
                  <td className="py-3 px-4"><StatusBadge status={d.disposalStatus} /></td>
                  <td className="py-3 px-4 text-[#6A788D] max-w-[180px] truncate">{d.notes || "â€”"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Add Debris Record</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Debris Type</Label>
              <Select onValueChange={(value) => setValue("type", value as string)}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>{debrisTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Quantity</Label>
                <Input type="number" step="0.1" {...register("quantity", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Unit</Label>
                <Select onValueChange={(value) => setValue("unit", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Unit..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cubic Meters">Cubic Meters</SelectItem>
                    <SelectItem value="Tons">Tons</SelectItem>
                    <SelectItem value="Loads">Loads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Site Zone</Label>
              <Select onValueChange={(value) => setValue("zone", value as string)}>
                <SelectTrigger><SelectValue placeholder="Select zone..." /></SelectTrigger>
                <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Removal Vendor</Label>
                <Input {...register("removalVendor")} placeholder="Vendor name" />
              </div>
              <div className="grid gap-1.5">
                <Label>Removal Date</Label>
                <Input type="date" {...register("removalDate")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Cost (PKR)</Label>
                <Input type="number" {...register("cost", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Disposal Status</Label>
                <Select defaultValue="Pending" onValueChange={(v) => setValue("disposalStatus", v as DisposalStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Removed">Removed</SelectItem>
                    <SelectItem value="Disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Add Record</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
