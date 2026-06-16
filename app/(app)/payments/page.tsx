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
import { CreditCard, Plus, Search, DollarSign, CheckCircle } from "lucide-react";
import type { Payment, PaymentMethod } from "@/lib/types";

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice required"),
  paymentDate: z.string().min(1, "Date required"),
  amount: z.number().min(1),
  method: z.enum(["Bank Transfer", "Cheque", "Online", "Cash"]),
  referenceNumber: z.string().min(1, "Reference required"),
  notes: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export default function PaymentsPage() {
  const { state, addPayment, addActivity } = useApp();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "Bank Transfer" },
  });

  const selectedInvoiceId = watch("invoiceId");
  const selectedInvoice = state.invoices.find((inv) => inv.id === selectedInvoiceId);

  const filtered = state.payments.filter((p) =>
    p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = state.payments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = state.invoices.filter((i) => i.status === "Approved").reduce((s, i) => s + i.totalAmount, 0);
  const methodBadgeColors: Record<string, string> = {
    "Bank Transfer": "#1968D3",
    "Cheque": "#8B5CF6",
    "Online": "#E07B00",
    "Cash": "#1E8E55",
  };

  function onSubmit(data: PaymentForm) {
    const invoice = state.invoices.find((i) => i.id === data.invoiceId);
    if (!invoice) return;
    const payNumber = `PAY-2026-${String(state.payments.length + 1).padStart(3, "0")}`;
    const newPayment: Payment = {
      id: generateId("pay"),
      paymentNumber: payNumber,
      invoiceId: data.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      vendorId: invoice.vendorId,
      vendorName: invoice.vendorName,
      paymentDate: data.paymentDate,
      amount: Number(data.amount),
      method: data.method as PaymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes ?? "",
    };
    addPayment(newPayment);
    addActivity({ module: "Payment", action: "paid", description: `Recorded payment ${payNumber} to ${invoice.vendorName} — ${formatPKR(Number(data.amount))}`, referenceId: newPayment.id, referenceNumber: payNumber, performedBy: "Ali Khan", role: "Finance Officer" });
    toast.success(`Payment ${payNumber} recorded and invoice marked as paid`);
    reset();
    setAddOpen(false);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Payments"
        subtitle="Record and track all payments to vendors."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
            <Plus size={14} />Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard label="Total Paid" value={`PKR ${(totalPaid / 1000000).toFixed(1)}M`} icon={CheckCircle} variant="success" />
        <StatCard label="Pending Release" value={formatPKR(pendingAmount)} subtext="Approved, not yet paid" icon={DollarSign} variant="warning" />
        <StatCard label="Total Payments" value={String(state.payments.length)} icon={CreditCard} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments recorded" />
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#F8F9FC]">
              <tr className="border-b border-[#E3E8F0]">
                {["Payment #", "Invoice #", "Vendor", "Date", "Amount", "Method", "Reference #", "Notes"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => (
                <tr key={pay.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                  <td className="py-3 px-4 font-mono-id font-semibold text-[#14223B]">{pay.paymentNumber}</td>
                  <td className="py-3 px-4 font-mono-id text-[#6A788D]">{pay.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium text-[#14223B]">{pay.vendorName}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{pay.paymentDate}</td>
                  <td className="py-3 px-4 font-semibold font-mono-id text-[#1E8E55]">{formatPKR(pay.amount)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: methodBadgeColors[pay.method] ?? "#6A788D" }}>
                      {pay.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono-id text-[#6A788D]">{pay.referenceNumber}</td>
                  <td className="py-3 px-4 text-[#6A788D]">{pay.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Record Payment</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Invoice</Label>
              <Select onValueChange={(value) => setValue("invoiceId", value as string)}>
                <SelectTrigger><SelectValue placeholder="Select approved invoice..." /></SelectTrigger>
                <SelectContent>
                  {state.invoices.filter((i) => i.status === "Approved").map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.vendorName} ({formatPKR(inv.totalAmount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.invoiceId && <p className="text-[11px] text-red-600">{errors.invoiceId.message}</p>}
            </div>
            {selectedInvoice && (
              <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px]">
                <div className="flex justify-between"><span className="text-[#6A788D]">Vendor:</span><span className="font-semibold">{selectedInvoice.vendorName}</span></div>
                <div className="flex justify-between mt-1"><span className="text-[#6A788D]">Total Due:</span><span className="font-bold text-[#C0453F]">{formatPKR(selectedInvoice.totalAmount)}</span></div>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Payment Date</Label>
              <Input type="date" {...register("paymentDate")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount (PKR)</Label>
              <Input type="number" {...register("amount", { valueAsNumber: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Payment Method</Label>
                <Select defaultValue="Bank Transfer" onValueChange={(v) => setValue("method", v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Reference Number</Label>
                <Input {...register("referenceNumber")} placeholder="TXN / CHQ number" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 text-white" style={{ background: "#E07B00" }}>Record Payment</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
