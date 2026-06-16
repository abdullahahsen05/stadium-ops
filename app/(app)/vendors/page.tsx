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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Plus, Search, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Vendor, VendorStatus } from "@/lib/types";

const vendorSchema = z.object({
  name: z.string().min(2, "Name required"),
  contactPerson: z.string().min(1, "Contact required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone required"),
  address: z.string().min(1, "Address required"),
  category: z.string().min(1, "Category required"),
});
type VendorForm = z.infer<typeof vendorSchema>;

export default function VendorsPage() {
  const { state, addVendor, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VendorForm>({ resolver: zodResolver(vendorSchema) });

  const filtered = state.vendors.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeVendors = state.vendors.filter((v) => v.status === "Active").length;
  const onHold = state.vendors.filter((v) => v.status === "On Hold").length;
  const totalValue = state.vendors.reduce((s, v) => s + v.totalPOValue, 0);

  function onSubmit(data: VendorForm) {
    const code = `VND-${String(state.vendors.length + 1).padStart(3, "0")}`;
    const newVendor: Vendor = {
      id: generateId("v"),
      code,
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      category: data.category,
      status: "Active",
      totalPOValue: 0,
      pendingInvoiceAmount: 0,
      totalDeliveries: 0,
      onTimeDeliveries: 0,
      rating: 0,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    addVendor(newVendor);
    addActivity({ module: "Vendor", action: "created", description: `Added vendor ${newVendor.name}`, referenceId: newVendor.id, referenceNumber: code, performedBy: "Ali Khan", role: "Procurement Officer" });
    toast.success(`Vendor "${data.name}" added`);
    reset();
    setAddOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Vendors"
        subtitle="Manage construction material suppliers and track their performance."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Plus size={14} />Add Vendor
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Active Vendors" value={String(activeVendors)} icon={Building2} variant="success" />
        <StatCard label="On Hold" value={String(onHold)} icon={Building2} variant="warning" />
        <StatCard label="Total PO Value" value={`PKR ${(totalValue / 1000000).toFixed(0)}M`} icon={Building2} variant="info" />
        <StatCard label="Total Vendors" value={String(state.vendors.length)} icon={Building2} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} vendors</div>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No vendors found" />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Code", "Vendor Name", "Category", "Contact", "Total PO Value", "Deliveries", "On-Time Rate", "Pending Invoices", "Rating", "Status", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((vendor) => {
                const onTimeRate = vendor.totalDeliveries > 0
                  ? Math.round((vendor.onTimeDeliveries / vendor.totalDeliveries) * 100) : 100;
                return (
                  <tr key={vendor.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 px-4 font-mono-id text-[#6A788D]">{vendor.code}</td>
                    <td className="py-3 px-4 font-semibold text-[#14223B]">
                      <Link href={`/vendors/${vendor.id}`} className="hover:text-[#E07B00]">{vendor.name}</Link>
                    </td>
                    <td className="py-3 px-4 text-[#6A788D]">{vendor.category}</td>
                    <td className="py-3 px-4 text-[#6A788D]">{vendor.contactPerson}</td>
                    <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(vendor.totalPOValue)}</td>
                    <td className="py-3 px-4 font-mono-id">{vendor.onTimeDeliveries}/{vendor.totalDeliveries}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${onTimeRate}%`, background: onTimeRate >= 90 ? "#1E8E55" : onTimeRate >= 75 ? "#C8901F" : "#C0453F" }} />
                        </div>
                        <span className="font-semibold text-[11.5px]" style={{ color: onTimeRate >= 90 ? "#1E8E55" : onTimeRate >= 75 ? "#C8901F" : "#C0453F" }}>{onTimeRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono-id text-[#C8901F]">{formatPKR(vendor.pendingInvoiceAmount)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#E07B00] fill-[#E07B00]" />
                        <span className="font-semibold">{vendor.rating > 0 ? vendor.rating.toFixed(1) : "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={vendor.status} /></td>
                    <td className="py-3 px-4">
                      <Link href={`/vendors/${vendor.id}`} className="flex items-center gap-1 text-[12px] font-semibold text-[#E07B00] hover:underline">
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

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Add Vendor</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Company Name</Label>
              <Input {...register("name")} placeholder="e.g. Metro Steel Works" />
              {errors.name && <p className="text-[11px] text-red-600">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Contact Person</Label>
                <Input {...register("contactPerson")} placeholder="Full name" />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Input {...register("category")} placeholder="e.g. Steel, Concrete" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="+92 300 xxxxxxx" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Address</Label>
              <Input {...register("address")} placeholder="City, Area" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Add Vendor</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
