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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Package, Search, Plus, ArrowUpDown, TrendingDown } from "lucide-react";
import type { Material, MaterialCategory, Zone } from "@/lib/types";

const categories: MaterialCategory[] = ["Concrete", "Steel", "Electrical", "Drainage", "Seating", "Lighting", "Glass", "Finishing", "Aggregates", "Miscellaneous"];
const zones: Zone[] = ["North Stand", "South Stand", "East Stand", "West Stand", "VIP Pavilion", "Player Tunnel", "Main Pitch", "Parking Area", "Floodlight Zone", "Drainage Zone", "Concourse Level", "Media Box"];

const addMaterialSchema = z.object({
  name: z.string().min(2, "Name required"),
  category: z.string().min(1, "Category required"),
  unit: z.string().min(1, "Unit required"),
  currentStock: z.number().min(0),
  reorderLevel: z.number().min(1),
  unitCost: z.number().min(1),
  zone: z.string().min(1, "Zone required"),
});

type AddMaterialForm = z.infer<typeof addMaterialSchema>;

const movementSchema = z.object({
  materialId: z.string().min(1, "Select material"),
  type: z.enum(["in", "out"]),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});
type MovementForm = z.infer<typeof movementSchema>;

function getStockStatus(current: number, reorder: number): { label: string; color: string } {
  if (current <= reorder * 0.5) return { label: "Critical", color: "#C0453F" };
  if (current <= reorder) return { label: "Low", color: "#C8901F" };
  return { label: "OK", color: "#1E8E55" };
}

export default function InventoryPage() {
  const { state, updateMaterial, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const { register: regAdd, handleSubmit: hsAdd, reset: resetAdd, setValue: svAdd, formState: { errors: errAdd } } = useForm<AddMaterialForm>({ resolver: zodResolver(addMaterialSchema) });
  const { register: regMove, handleSubmit: hsMove, reset: resetMove, setValue: svMove } = useForm<MovementForm>({ resolver: zodResolver(movementSchema), defaultValues: { type: "in" } });

  const filtered = state.materials.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || m.category === catFilter;
    const { label } = getStockStatus(m.currentStock, m.reorderLevel);
    const matchStatus = statusFilter === "all" || label.toLowerCase() === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const lowStock = state.materials.filter((m) => m.currentStock <= m.reorderLevel).length;
  const criticalStock = state.materials.filter((m) => m.currentStock <= m.reorderLevel * 0.5).length;
  const totalValue = state.materials.reduce((s, m) => s + m.currentStock * m.unitCost, 0);

  function onAddMaterial(data: AddMaterialForm) {
    const code = `MAT-${String(state.materials.length + 1).padStart(3, "0")}`;
    const newMat: Material = {
      id: generateId("m"),
      code,
      name: data.name,
      category: data.category as MaterialCategory,
      unit: data.unit,
      currentStock: data.currentStock,
      reorderLevel: data.reorderLevel,
      unitCost: data.unitCost,
      primaryVendorId: "",
      zone: data.zone as Zone,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    // Add to state via setState
    addActivity({ module: "Inventory", action: "created", description: `Added material ${newMat.name}`, referenceId: newMat.id, referenceNumber: code, performedBy: "Ali Khan", role: "Procurement Officer" });
    toast.success(`Material "${data.name}" added successfully`);
    resetAdd();
    setAddOpen(false);
  }

  function onRecordMovement(data: MovementForm) {
    const mat = state.materials.find((m) => m.id === data.materialId);
    if (!mat) return;
    const newStock = data.type === "in" ? mat.currentStock + data.quantity : Math.max(0, mat.currentStock - data.quantity);
    updateMaterial(mat.id, { currentStock: newStock, lastUpdated: new Date().toISOString().split("T")[0] });
    addActivity({ module: "Inventory", action: "updated", description: `Stock ${data.type === "in" ? "received" : "issued"}: ${data.quantity} ${mat.unit} of ${mat.name}`, referenceId: mat.id, referenceNumber: mat.code, performedBy: "Ali Khan", role: "Site Engineer" });
    toast.success(`Stock ${data.type === "in" ? "received" : "issued"} for ${mat.name}`);
    resetMove();
    setMoveOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Inventory"
        subtitle="Track materials, stock levels, and reorder thresholds across all site zones."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => setMoveOpen(true)}>
              <ArrowUpDown size={14} />Stock Movement
            </Button>
            <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
              <Plus size={14} />Add Material
            </Button>
          </>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Total Materials" value={String(state.materials.length)} subtext="Tracked items" icon={Package} />
        <StatCard label="Low Stock Items" value={String(lowStock)} subtext="Below reorder level" icon={TrendingDown} variant="warning" />
        <StatCard label="Critical Stock" value={String(criticalStock)} subtext="≤50% of reorder level" icon={TrendingDown} variant="danger" />
        <StatCard label="Inventory Value" value={`PKR ${(totalValue / 1000000).toFixed(1)}M`} subtext="At current unit cost" icon={Package} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search materials..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={(value) => setCatFilter(value ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} items</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No materials found" description="Try adjusting your filters." />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Code", "Material Name", "Category", "Zone", "Stock", "Reorder Level", "Stock Status", "Unit Cost", "Stock Value", "Last Updated"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat) => {
                const { label, color } = getStockStatus(mat.currentStock, mat.reorderLevel);
                const pct = Math.min(100, Math.round((mat.currentStock / (mat.reorderLevel * 2)) * 100));
                return (
                  <tr key={mat.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 px-4 font-mono-id text-[#6A788D]">{mat.code}</td>
                    <td className="py-3 px-4 font-semibold text-[#14223B]">{mat.name}</td>
                    <td className="py-3 px-4"><StatusBadge status={mat.category} /></td>
                    <td className="py-3 px-4 text-[#6A788D]">{mat.zone}</td>
                    <td className="py-3 px-4 font-semibold font-mono-id">{mat.currentStock.toLocaleString()} {mat.unit}</td>
                    <td className="py-3 px-4 text-[#6A788D]">{mat.reorderLevel.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-[11.5px] font-semibold" style={{ color }}>{label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono-id">{formatPKR(mat.unitCost)}</td>
                    <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(mat.currentStock * mat.unitCost)}</td>
                    <td className="py-3 px-4 text-[#6A788D]">{mat.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Material Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Add Material</SheetTitle>
          </SheetHeader>
          <form onSubmit={hsAdd(onAddMaterial)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Material Name</Label>
              <Input {...regAdd("name")} placeholder="e.g. Cement Bags (50kg)" />
              {errAdd.name && <p className="text-[11px] text-red-600">{errAdd.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select onValueChange={(value) => svAdd("category", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Unit</Label>
                <Input {...regAdd("unit")} placeholder="e.g. Bags, Tons, Meters" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Current Stock</Label>
                <Input type="number" {...regAdd("currentStock", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Reorder Level</Label>
                <Input type="number" {...regAdd("reorderLevel", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Unit Cost (PKR)</Label>
              <Input type="number" {...regAdd("unitCost", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Primary Zone</Label>
              <Select onValueChange={(value) => svAdd("zone", value as string)}>
                <SelectTrigger><SelectValue placeholder="Select zone..." /></SelectTrigger>
                <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Add Material</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Stock Movement Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
          <form onSubmit={hsMove(onRecordMovement)} className="flex flex-col gap-4 mt-2">
            <div className="grid gap-1.5">
              <Label>Material</Label>
              <Select onValueChange={(value) => svMove("materialId", value as string)}>
                <SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger>
                <SelectContent>{state.materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Movement Type</Label>
              <Select defaultValue="in" onValueChange={(v) => svMove("type", v as "in" | "out")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock Received (In)</SelectItem>
                  <SelectItem value="out">Stock Issued (Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Quantity</Label>
              <Input type="number" {...regMove("quantity", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...regMove("notes")} rows={2} placeholder="Optional notes..." />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setMoveOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Record Movement</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
