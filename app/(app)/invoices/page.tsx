"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { formatPKR, generateId, addDays, isOverdue, isDueSoon } from "@/lib/store";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Receipt, Plus, Search, CheckCircle, XCircle, DollarSign, AlertTriangle } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number required"),
  vendorId: z.string().min(1, "Vendor required"),
  poId: z.string().optional(),
  invoiceDate: z.string().min(1, "Date required"),
  amount: z.number().min(1),
  tax: z.number().min(0),
  notes: z.string().optional(),
});
type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function InvoicesPage() {
  const { state, addInvoice, updateInvoice, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InvoiceForm>({ resolver: zodResolver(invoiceSchema) });
  const amt = watch("amount") ?? 0;
  const tax = watch("tax") ?? 0;

  const filtered = state.invoices.filter((inv) => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || inv.status === tab ||
      (tab === "overdue" && (inv.status === "Pending" || inv.status === "Approved") && isOverdue(inv.dueDate));
    return matchSearch && matchTab;
  });

  const pending = state.invoices.filter((i) => i.status === "Pending").length;
  const overdue = state.invoices.filter((i) => (i.status === "Pending" || i.status === "Approved") && isOverdue(i.dueDate)).length;
  const approved = state.invoices.filter((i) => i.status === "Approved").length;
  const paid = state.invoices.filter((i) => i.status === "Paid").length;
  const totalPending = state.invoices.filter((i) => ["Pending", "Approved"].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);

  function onAddInvoice(data: InvoiceForm) {
    const vendor = state.vendors.find((v) => v.id === data.vendorId);
    if (!vendor) return;
    const po = state.purchaseOrders.find((po) => po.id === data.poId);
    const total = Number(data.amount) + Number(data.tax);
    const dueDate = addDays(data.invoiceDate, 10);
    const newInvoice: Invoice = {
      id: generateId("inv"),
      invoiceNumber: data.invoiceNumber,
      vendorId: data.vendorId,
      vendorName: vendor.name,
      poId: data.poId ?? "",
      poNumber: po?.poNumber ?? "",
      invoiceDate: data.invoiceDate,
      dueDate,
      amount: Number(data.amount),
      tax: Number(data.tax),
      totalAmount: total,
      status: "Pending",
      notes: data.notes ?? "",
    };
    addInvoice(newInvoice);
    if (isDueSoon(dueDate, 5)) {
      // auto-generate alert
    }
    addActivity({ module: "Invoice", action: "created", description: `Added invoice ${data.invoiceNumber} from ${vendor.name} â€” ${formatPKR(total)}`, referenceId: newInvoice.id, referenceNumber: data.invoiceNumber, performedBy: "Ali Khan", role: "Finance Officer" });
    toast.success(`Invoice ${data.invoiceNumber} added`);
    reset();
    setAddOpen(false);
  }

  function approve(inv: Invoice) {
    updateInvoice(inv.id, { status: "Approved", approvedDate: new Date().toISOString().split("T")[0] });
    addActivity({ module: "Invoice", action: "approved", description: `Approved invoice ${inv.invoiceNumber} from ${inv.vendorName} â€” ${formatPKR(inv.totalAmount)}`, referenceId: inv.id, referenceNumber: inv.invoiceNumber, performedBy: "Ali Khan", role: "Finance Officer" });
    toast.success(`Invoice ${inv.invoiceNumber} approved`);
  }

  function reject(inv: Invoice) {
    updateInvoice(inv.id, { status: "Rejected", rejectedDate: new Date().toISOString().split("T")[0], rejectionReason: rejectReason });
    addActivity({ module: "Invoice", action: "rejected", description: `Rejected invoice ${inv.invoiceNumber} â€” ${rejectReason}`, referenceId: inv.id, referenceNumber: inv.invoiceNumber, performedBy: "Ali Khan", role: "Finance Officer" });
    toast.success(`Invoice ${inv.invoiceNumber} rejected`);
    setRejectId(null);
    setRejectReason("");
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Invoices"
        subtitle="Manage vendor invoices â€” approve, reject, track due dates and aging."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Plus size={14} />Add Invoice
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Pending Approval" value={String(pending)} icon={Receipt} variant="warning" />
        <StatCard label="Overdue Invoices" value={String(overdue)} subtext="Past due date" icon={AlertTriangle} variant="danger" />
        <StatCard label="Approved (Unpaid)" value={String(approved)} subtext="Awaiting payment" icon={CheckCircle} variant="info" />
        <StatCard label="Pending Amount" value={`PKR ${(totalPending / 1000000).toFixed(1)}M`} icon={DollarSign} variant="warning" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Approved">Approved</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="Paid">Paid</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices found" />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Invoice #", "Vendor", "PO #", "Invoice Date", "Due Date", "Amount", "Tax", "Total", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const dueSoon = (inv.status === "Pending" || inv.status === "Approved") && isDueSoon(inv.dueDate);
                const ov = (inv.status === "Pending" || inv.status === "Approved") && isOverdue(inv.dueDate);
                return (
                  <tr key={inv.id} className={`border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors ${ov ? "bg-red-50/30" : ""}`}>
                    <td className="py-3 px-4 font-mono-id font-semibold text-[#14223B]">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-[#14223B]">{inv.vendorName}</td>
                    <td className="py-3 px-4 font-mono-id text-[#6A788D]">{inv.poNumber || "â€”"}</td>
                    <td className="py-3 px-4 text-[#6A788D]">{inv.invoiceDate}</td>
                    <td className="py-3 px-4">
                      <span className={ov ? "text-[#C0453F] font-semibold" : dueSoon ? "text-[#C8901F] font-semibold" : "text-[#6A788D]"}>
                        {inv.dueDate}{ov ? " âš " : dueSoon ? " â°" : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-id">{formatPKR(inv.amount)}</td>
                    <td className="py-3 px-4 font-mono-id text-[#6A788D]">{formatPKR(inv.tax)}</td>
                    <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(inv.totalAmount)}</td>
                    <td className="py-3 px-4"><StatusBadge status={ov && inv.status !== "Paid" ? "Overdue" : inv.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {inv.status === "Pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[#1E8E55] hover:text-[#1E8E55] hover:bg-green-50" onClick={() => approve(inv)}>
                              <CheckCircle size={12} />Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[#C0453F] hover:text-[#C0453F] hover:bg-red-50" onClick={() => setRejectId(inv.id)}>
                              <XCircle size={12} />Reject
                            </Button>
                          </>
                        )}
                        {inv.status === "Approved" && (
                          <a href="/payments" className="text-[12px] font-semibold text-[#E07B00] hover:underline flex items-center gap-1">
                            <DollarSign size={12} />Pay
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Invoice Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Add Invoice</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onAddInvoice)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Invoice Number</Label>
              <Input {...register("invoiceNumber")} placeholder="e.g. INV-2026-011" />
              {errors.invoiceNumber && <p className="text-[11px] text-red-600">{errors.invoiceNumber.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Vendor</Label>
                <Select onValueChange={(value) => setValue("vendorId", value as string)}>
                  <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                  <SelectContent>{state.vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.vendorId && <p className="text-[11px] text-red-600">{errors.vendorId.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Related PO</Label>
                <Select onValueChange={(value) => setValue("poId", (value as string) || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Select PO..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {state.purchaseOrders.map((po) => <SelectItem key={po.id} value={po.id}>{po.poNumber}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Invoice Date</Label>
              <Input type="date" {...register("invoiceDate")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Amount (PKR)</Label>
                <Input type="number" {...register("amount", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Tax (PKR)</Label>
                <Input type="number" {...register("tax", { valueAsNumber: true })} defaultValue={0} />
              </div>
            </div>
            <div className="p-3 bg-[#F8F9FC] rounded-lg">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-[#6A788D]">Total Amount:</span>
                <span className="font-bold text-[#14223B]">{formatPKR(Number(amt) + Number(tax))}</span>
              </div>
              <div className="flex justify-between text-[12px] text-[#6A788D] mt-1">
                <span>Due Date (auto):</span>
                <span>Invoice date + 10 days</span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Add Invoice</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      {rejectId && (
        <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Reject Invoice</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid gap-1.5">
                <Label>Rejection Reason</Label>
                <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this invoice is being rejected..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>Cancel</Button>
                <Button className="flex-1 bg-[#C0453F] text-white hover:bg-red-700" onClick={() => {
                  const inv = state.invoices.find((i) => i.id === rejectId);
                  if (inv) reject(inv);
                }}>Reject Invoice</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
