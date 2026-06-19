"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { generateId } from "@/lib/store";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Truck, Plus, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { Delivery, Zone, ConditionStatus } from "@/lib/types";

const zones: Zone[] = ["North Stand", "South Stand", "East Stand", "West Stand", "VIP Pavilion", "Player Tunnel", "Main Pitch", "Parking Area", "Floodlight Zone", "Drainage Zone", "Concourse Level", "Media Box"];

const deliverySchema = z.object({
  poId: z.string().min(1, "PO required"),
  materialId: z.string().min(1, "Material required"),
  deliveredQty: z.number().min(1),
  receivedDate: z.string().min(1, "Date required"),
  receivedBy: z.string().min(1, "Receiver required"),
  zone: z.string().min(1, "Zone required"),
  condition: z.enum(["Good", "Damaged", "Partial"]),
  notes: z.string().optional(),
});
type DeliveryForm = z.infer<typeof deliverySchema>;

export default function DeliveriesPage() {
  const { state, addDelivery, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { condition: "Good" },
  });

  const filtered = state.deliveries.filter((d) => {
    const matchSearch = d.deliveryNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      d.materialName.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || d.status === tab;
    return matchSearch && matchTab;
  });

  const delivered = state.deliveries.filter((d) => d.status === "Delivered").length;
  const partial = state.deliveries.filter((d) => d.status === "Partial").length;
  const delayed = state.deliveries.filter((d) => d.status === "Delayed").length;
  const scheduled = state.deliveries.filter((d) => d.status === "Scheduled").length;

  const poItems = selectedPO ? state.purchaseOrders.find((po) => po.id === selectedPO)?.items ?? [] : [];

  function onSubmit(data: DeliveryForm) {
    const po = state.purchaseOrders.find((p) => p.id === data.poId);
    const mat = state.materials.find((m) => m.id === data.materialId);
    if (!po || !mat) return;
    const deliveryNumber = `DEL-2026-${String(state.deliveries.length + 1).padStart(3, "0")}`;
    const newDelivery: Delivery = {
      id: generateId("d"),
      deliveryNumber,
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      materialId: data.materialId,
      materialName: mat.name,
      orderedQty: po.items.find((i) => i.materialId === data.materialId)?.quantity ?? 0,
      deliveredQty: data.deliveredQty,
      receivedDate: data.receivedDate,
      expectedDate: po.expectedDeliveryDate,
      receivedBy: data.receivedBy,
      zone: data.zone as Zone,
      condition: data.condition as ConditionStatus,
      status: "Delivered",
      notes: data.notes ?? "",
    };
    addDelivery(newDelivery);
    addActivity({ module: "Delivery", action: "received", description: `Received ${data.deliveredQty} ${mat.unit} of ${mat.name} from ${po.vendorName}`, referenceId: newDelivery.id, referenceNumber: deliveryNumber, performedBy: data.receivedBy, role: "Site Engineer" });
    toast.success(`Delivery ${deliveryNumber} recorded`);
    reset();
    setAddOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Deliveries"
        subtitle="Track material deliveries from vendors to site zones."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Plus size={14} />Record Delivery
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Deliveries" value={String(state.deliveries.length)} icon={Truck} />
        <StatCard label="Delivered" value={String(delivered)} icon={CheckCircle} variant="success" />
        <StatCard label="Delayed" value={String(delayed)} subtext="Past expected date" icon={AlertTriangle} variant="danger" />
        <StatCard label="Partial / Scheduled" value={String(partial + scheduled)} icon={Clock} variant="warning" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search deliveries..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Delivered">Delivered</TabsTrigger>
            <TabsTrigger value="Partial">Partial</TabsTrigger>
            <TabsTrigger value="Delayed">Delayed</TabsTrigger>
            <TabsTrigger value="Scheduled">Scheduled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Truck} title="No deliveries found" />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Delivery #", "PO #", "Vendor", "Material", "Ordered", "Delivered", "Expected", "Received Date", "Zone", "Condition", "Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                  <td className="py-3 px-4 font-mono-id text-[#6A788D]">{d.deliveryNumber}</td>
                  <td className="py-3 px-4 font-mono-id text-[#E07B00]">
                    <a href={`/purchase-orders/${d.poId}`} className="hover:underline">{d.poNumber}</a>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#14223B]">{d.vendorName}</td>
                  <td className="py-3 px-4 text-[#14223B]">{d.materialName}</td>
                  <td className="py-3 px-4 font-mono-id">{d.orderedQty.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono-id text-[#1E8E55]">{d.deliveredQty.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{d.expectedDate}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{d.receivedDate || "—"}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{d.zone}</td>
                  <td className="py-3 px-4"><StatusBadge status={d.condition} /></td>
                  <td className="py-3 px-4"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Record Delivery</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Purchase Order</Label>
              <Select onValueChange={(value) => { const poId = value as string; setValue("poId", poId); setSelectedPO(poId); }}>
                <SelectTrigger><SelectValue placeholder="Select PO..." /></SelectTrigger>
                <SelectContent>{state.purchaseOrders.filter((po) => ["Sent", "Partial"].includes(po.status)).map((po) => <SelectItem key={po.id} value={po.id}>{po.poNumber} — {po.vendorName}</SelectItem>)}</SelectContent>
              </Select>
              {errors.poId && <p className="text-[11px] text-red-600">{errors.poId.message}</p>}
            </div>
            {selectedPO && (
              <div className="grid gap-1.5">
                <Label>Material</Label>
                <Select onValueChange={(value) => setValue("materialId", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger>
                  <SelectContent>{poItems.map((i) => <SelectItem key={i.materialId} value={i.materialId}>{i.materialName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Delivered Quantity</Label>
                <Input type="number" {...register("deliveredQty", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Received Date</Label>
                <Input type="date" {...register("receivedDate")} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Received By</Label>
              <Input {...register("receivedBy")} placeholder="Name of site receiver" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Site Zone</Label>
                <Select onValueChange={(value) => setValue("zone", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Zone..." /></SelectTrigger>
                  <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Condition</Label>
                <Select defaultValue="Good" onValueChange={(v) => setValue("condition", v as "Good" | "Damaged" | "Partial")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} placeholder="Optional notes..." />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Record Delivery</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
