"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { useClientData } from "@/lib/client-data/client-context";
import { formatPKR, generateId, addDays } from "@/lib/store";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText, Plus, Search, Truck, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { PurchaseOrder, PurchaseOrderItem, Zone } from "@/lib/types";

const zones: Zone[] = ["North Stand", "South Stand", "East Stand", "West Stand", "VIP Pavilion", "Player Tunnel", "Main Pitch", "Parking Area", "Floodlight Zone", "Drainage Zone", "Concourse Level", "Media Box"];

const poSchema = z.object({
  vendorId: z.string().min(1, "Vendor required"),
  zone: z.string().min(1, "Zone required"),
  createdDate: z.string().min(1, "Date required"),
  notes: z.string().optional(),
});
type POForm = z.infer<typeof poSchema>;

const ALL_DISCIPLINES = ["All", "TSF", "Safety Equipments", "Consumables", "ELECTRICAL"];
const ALL_STATUSES = ["All", "Paid 100%", "Invoice sent to HO", "To be Processed"];

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        color: getPaymentStatusColor(status),
        background: getPaymentStatusBg(status),
      }}
    >
      {status}
    </span>
  );
}

export default function PurchaseOrdersPage() {
  const { state, addPurchaseOrder, addActivity } = useApp();
  const { clientRecords } = useClientData();

  const [mainTab, setMainTab] = useState("client");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [items, setItems] = useState<{ materialId: string; quantity: number; unitCost: number }[]>([
    { materialId: "", quantity: 1, unitCost: 0 }
  ]);

  // Client PO filters
  const [clientSearch, setClientSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<POForm>({ resolver: zodResolver(poSchema) });

  const filtered = state.purchaseOrders.filter((po) => {
    const matchSearch = po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || po.status === tab;
    return matchSearch && matchTab;
  });

  const filteredClientRecords = clientRecords.filter((r) => {
    const matchSearch = clientSearch === "" ||
      r.po.poRef.toLowerCase().includes(clientSearch.toLowerCase()) ||
      r.po.description.toLowerCase().includes(clientSearch.toLowerCase()) ||
      r.po.vendorName.toLowerCase().includes(clientSearch.toLowerCase());
    const matchDiscipline = disciplineFilter === "All" || r.po.discipline === disciplineFilter;
    const matchStatus = statusFilter === "All" || r.invoice.paymentStatus === statusFilter;
    return matchSearch && matchDiscipline && matchStatus;
  });

  const counts = {
    all: state.purchaseOrders.length,
    Draft: state.purchaseOrders.filter((p) => p.status === "Draft").length,
    Sent: state.purchaseOrders.filter((p) => p.status === "Sent").length,
    Partial: state.purchaseOrders.filter((p) => p.status === "Partial").length,
    Delivered: state.purchaseOrders.filter((p) => p.status === "Delivered").length,
    Completed: state.purchaseOrders.filter((p) => p.status === "Completed").length,
  };

  const totalValue = state.purchaseOrders.reduce((s, po) => s + po.totalAmount, 0);
  const activePOs = state.purchaseOrders.filter((po) => ["Sent", "Partial"].includes(po.status)).length;
  const draftPOs = state.purchaseOrders.filter((po) => po.status === "Draft").length;

  function addItem() {
    setItems([...items, { materialId: "", quantity: 1, unitCost: 0 }]);
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function onSubmit(data: POForm) {
    const vendor = state.vendors.find((v) => v.id === data.vendorId);
    if (!vendor) return;
    const poItems: PurchaseOrderItem[] = items.filter((i) => i.materialId).map((i) => {
      const mat = state.materials.find((m) => m.id === i.materialId);
      return { materialId: i.materialId, materialName: mat?.name ?? "", quantity: i.quantity, unitCost: i.unitCost, deliveredQty: 0 };
    });
    const total = poItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const poNumber = `PO-2026-${String(state.purchaseOrders.length + 1).padStart(3, "0")}`;
    const newPO: PurchaseOrder = {
      id: generateId("po"),
      poNumber,
      vendorId: data.vendorId,
      vendorName: vendor.name,
      zone: data.zone as Zone,
      status: "Draft",
      createdDate: data.createdDate,
      expectedDeliveryDate: addDays(data.createdDate, 10),
      items: poItems,
      totalAmount: total,
      notes: data.notes ?? "",
    };
    addPurchaseOrder(newPO);
    addActivity({ module: "Purchase Order", action: "created", description: `Created ${poNumber} for ${vendor.name} — ${formatPKR(total)}`, referenceId: newPO.id, referenceNumber: poNumber, performedBy: "Ali Khan", role: "Procurement Officer" });
    toast.success(`${poNumber} created successfully`);
    reset();
    setItems([{ materialId: "", quantity: 1, unitCost: 0 }]);
    setAddOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Purchase Orders"
        subtitle="Create and track material procurement from vendors."
        actions={
          mainTab === "demo" ? (
            <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
              <Plus size={14} />Create PO
            </Button>
          ) : undefined
        }
      />

      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="client">Client Data (18 POs)</TabsTrigger>
          <TabsTrigger value="demo">Demo Data</TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "client" && (
        <>
          {/* Client PO Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
              <Input placeholder="Search PO ref, description, vendor..." className="pl-9" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </div>
            <Select value={disciplineFilter} onValueChange={(v) => setDisciplineFilter(v ?? "All")}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Disciplines" /></SelectTrigger>
              <SelectContent>
                {ALL_DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "All")}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto text-[13px] text-[#6A788D]">{filteredClientRecords.length} records</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            {filteredClientRecords.length === 0 ? (
              <EmptyState icon={FileText} title="No purchase orders found" description="Try adjusting your filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#F8F9FC]">
                    <tr className="border-b border-[#E3E8F0]">
                      {["Discipline", "PO Reference", "Vendor", "Initiated By", "Date Issued", "Description", "PO Amount", "Amount w/VAT", "INCO Term", "Payment Term", "Invoice Status", "Payment Status"].map((h) => (
                        <th key={h} className="text-left py-3 px-3 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                      ))}
                      <th className="py-3 px-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientRecords.map(({ po, invoice }) => (
                      <tr key={po.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors cursor-pointer">
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#1968D3]">
                            {po.discipline}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[12px] font-semibold text-[#14223B]">{po.poRef}</td>
                        <td className="py-3 px-3 font-medium text-[#14223B]">{po.vendorName}</td>
                        <td className="py-3 px-3 text-[#6A788D]">{po.initiatedBy}</td>
                        <td className="py-3 px-3 text-[#6A788D]">{po.dateIssued}</td>
                        <td className="py-3 px-3 text-[#14223B] max-w-[180px] truncate" title={po.description}>{po.description}</td>
                        <td className="py-3 px-3 font-mono text-[12px] font-semibold text-[#14223B]">{formatSAR(po.poAmount)}</td>
                        <td className="py-3 px-3 font-mono text-[12px] font-semibold text-[#14223B]">{formatSAR(po.amountWithVatSar)}</td>
                        <td className="py-3 px-3 text-[#6A788D]">{po.incoTerm}</td>
                        <td className="py-3 px-3 text-[#6A788D] whitespace-nowrap">{po.paymentTerm}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[12px] text-[#6A788D]">{invoice?.invoiceRef ?? "—"}</span>
                        </td>
                        <td className="py-3 px-3">
                          {invoice && <PaymentStatusBadge status={invoice.paymentStatus} />}
                        </td>
                        <td className="py-3 px-3">
                          <Link href={`/purchase-orders/${po.id}`} className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline whitespace-nowrap">
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {mainTab === "demo" && (
        <>
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            <StatCard label="Total PO Value" value={`PKR ${(totalValue / 1000000).toFixed(1)}M`} icon={FileText} />
            <StatCard label="Active Orders" value={String(activePOs)} subtext="Sent + Partial" icon={Truck} variant="info" />
            <StatCard label="Draft Orders" value={String(draftPOs)} subtext="Awaiting sending" icon={FileText} variant="warning" />
            <StatCard label="Total POs" value={String(state.purchaseOrders.length)} icon={FileText} variant="success" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
              <Input placeholder="Search PO number, vendor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="Draft">Draft ({counts.Draft})</TabsTrigger>
                <TabsTrigger value="Sent">Sent ({counts.Sent})</TabsTrigger>
                <TabsTrigger value="Partial">Partial ({counts.Partial})</TabsTrigger>
                <TabsTrigger value="Delivered">Delivered ({counts.Delivered})</TabsTrigger>
                <TabsTrigger value="Completed">Completed ({counts.Completed})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            {filtered.length === 0 ? (
              <EmptyState icon={FileText} title="No purchase orders found" description="Try adjusting your filters or create a new PO." />
            ) : (
              <table className="w-full text-[12.5px]">
                <thead className="bg-[#F8F9FC]">
                  <tr className="border-b border-[#E3E8F0]">
                    {["PO Number", "Vendor", "Zone", "Total Amount", "Created", "Expected Delivery", "Delivery Progress", "Status", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((po) => {
                    const totalOrdered = po.items.reduce((s, i) => s + i.quantity, 0);
                    const totalDelivered = po.items.reduce((s, i) => s + i.deliveredQty, 0);
                    const pct = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;
                    return (
                      <tr key={po.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                        <td className="py-3 px-4 font-mono-id font-semibold text-[#14223B]">{po.poNumber}</td>
                        <td className="py-3 px-4 font-medium text-[#14223B]">{po.vendorName}</td>
                        <td className="py-3 px-4 text-[#6A788D]">{po.zone}</td>
                        <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(po.totalAmount)}</td>
                        <td className="py-3 px-4 text-[#6A788D]">{po.createdDate}</td>
                        <td className="py-3 px-4 text-[#6A788D]">{po.expectedDeliveryDate}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#1E8E55]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11.5px] text-[#6A788D]">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={po.status} /></td>
                        <td className="py-3 px-4">
                          <Link href={`/purchase-orders/${po.id}`} className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Create PO Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Purchase Order</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Vendor</Label>
                <Select onValueChange={(value) => setValue("vendorId", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                  <SelectContent>{state.vendors.filter(v => v.status === "Active").map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.vendorId && <p className="text-[11px] text-red-600">{errors.vendorId.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Site Zone</Label>
                <Select onValueChange={(value) => setValue("zone", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Select zone..." /></SelectTrigger>
                  <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>PO Date</Label>
              <Input type="date" {...register("createdDate")} />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[13px] font-semibold">Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2 p-3 bg-[#F8F9FC] rounded-lg">
                  <Select onValueChange={(value) => {
                    const materialId = value as string;
                    const mat = state.materials.find((m) => m.id === materialId);
                    updateItem(idx, "materialId", materialId);
                    if (mat) updateItem(idx, "unitCost", mat.unitCost);
                  }}>
                    <SelectTrigger className="col-span-3 mb-1"><SelectValue placeholder="Material..." /></SelectTrigger>
                    <SelectContent>{state.materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">Quantity</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">Unit Cost (PKR)</Label>
                    <Input type="number" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", Number(e.target.value))} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px]">Subtotal</Label>
                    <div className="h-9 flex items-center font-mono-id font-semibold text-[12px] text-[#14223B]">
                      {formatPKR(item.quantity * item.unitCost)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-right text-[13px] font-bold text-[#14223B] mt-1">
                Total: {formatPKR(items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} placeholder="Optional notes..." />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Create PO</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
