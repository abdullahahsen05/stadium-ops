"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { useClientData } from "@/lib/client-data/client-context";
import { formatPKR, generateId } from "@/lib/store";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { ClientDataBanner } from "@/components/ui-custom/client-data-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard, Plus, Search, DollarSign, CheckCircle } from "lucide-react";
import type { Payment, PaymentMethod } from "@/lib/types";
import type { ClientInvoice } from "@/lib/client-data/types";

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice required"),
  paymentDate: z.string().min(1, "Date required"),
  amount: z.number().min(1),
  method: z.enum(["Bank Transfer", "Cheque", "Online", "Cash"]),
  referenceNumber: z.string().min(1, "Reference required"),
  notes: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: getPaymentStatusColor(status), background: getPaymentStatusBg(status) }}
    >
      {status}
    </span>
  );
}

const STATUS_OPTIONS = ["All", "Paid 100%", "Invoice sent to HO", "To be Processed"];

export default function PaymentsPage() {
  const { state, addPayment, addActivity } = useApp();
  const { clientInvoices, applyMutation, stats } = useClientData();
  const [mainTab, setMainTab] = useState("client");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("All");
  const [payDialog, setPayDialog] = useState<ClientInvoice | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

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

  const filteredClient = clientInvoices.filter((inv) => {
    const matchSearch = clientSearch === "" ||
      inv.invoiceRef.toLowerCase().includes(clientSearch.toLowerCase()) ||
      inv.poRef.toLowerCase().includes(clientSearch.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(clientSearch.toLowerCase());
    const matchStatus = clientStatusFilter === "All" || inv.paymentStatus === clientStatusFilter;
    return matchSearch && matchStatus;
  });

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

  function openClientPay(inv: ClientInvoice) {
    setPayDialog(inv);
    setPayAmount((inv.invoiceAmountWithVat - inv.paidAmount).toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef("");
    setPayNotes("");
  }

  function handleClientPayment() {
    if (!payDialog) return;
    if (!payRef.trim()) { toast.error("Reference number required"); return; }
    applyMutation({
      invoiceId: payDialog.id,
      paidAmount: Number(payAmount),
      paymentReceivedDate: payDate,
      paymentStatus: "Paid 100%",
      referenceNumber: payRef,
      notes: payNotes,
    });
    toast.success(`Payment recorded for ${payDialog.invoiceRef}`);
    setPayDialog(null);
  }

  return (
    <div className="animate-fade-in-up">
      <ClientDataBanner />
      <PageHeader
        title="Payments"
        subtitle="Record and track all payments to vendors."
        actions={
          mainTab === "demo" ? (
            <Button onClick={() => setAddOpen(true)} className="gap-2 text-white" style={{ background: "#E07B00" }}>
              <Plus size={14} />Record Payment
            </Button>
          ) : undefined
        }
      />

      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="client">Client Data</TabsTrigger>
          <TabsTrigger value="demo">Demo Data</TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "client" && (
        <>
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            <StatCard label="Total Paid" value={formatSAR(stats.totalPaid)} icon={CheckCircle} variant="success" />
            <StatCard label="Total Pending" value={formatSAR(stats.totalPending)} icon={DollarSign} variant="warning" />
            <StatCard label="Paid Invoices" value={`${stats.paidCount} / 18`} icon={CheckCircle} variant="success" />
            <StatCard label="Invoice Sent to HO" value={String(stats.invoiceSentToHoCount)} subtext="Awaiting HO payment" icon={CreditCard} variant="info" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
              <Input placeholder="Search by invoice ref, PO, vendor..." className="pl-9" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </div>
            <Select value={clientStatusFilter} onValueChange={(v) => setClientStatusFilter(v ?? "All")}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto text-[13px] text-[#6A788D]">{filteredClient.length} records</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            {filteredClient.length === 0 ? (
              <EmptyState icon={CreditCard} title="No payment records found" />
            ) : (
              <table className="w-full text-[12.5px]">
                <thead className="bg-[#F8F9FC]">
                  <tr className="border-b border-[#E3E8F0]">
                    {["Vendor", "PO Ref", "Invoice Ref", "Invoice Amt w/VAT", "Paid Amount", "Pending", "Payment Date", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClient.map((inv) => {
                    const pending = inv.invoiceAmountWithVat - inv.paidAmount;
                    return (
                      <tr key={inv.id} className="border-b border-[#F0F3F8] hover:bg-[#F8F9FC] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#14223B]">{inv.vendorName}</td>
                        <td className="py-3 px-4 font-mono text-[12px] text-[#6A788D]">{inv.poRef}</td>
                        <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#14223B]">{inv.invoiceRef}</td>
                        <td className="py-3 px-4 font-mono text-[12px]">{formatSAR(inv.invoiceAmountWithVat)}</td>
                        <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#1E8E55]">{inv.paidAmount > 0 ? formatSAR(inv.paidAmount) : "—"}</td>
                        <td className="py-3 px-4 font-mono text-[12px]" style={{ color: pending > 0 ? "#C0453F" : "#1E8E55" }}>
                          {pending > 0 ? formatSAR(pending) : "—"}
                        </td>
                        <td className="py-3 px-4 text-[#6A788D]">{inv.paymentReceivedDate || "—"}</td>
                        <td className="py-3 px-4"><PaymentStatusBadge status={inv.paymentStatus} /></td>
                        <td className="py-3 px-4">
                          {inv.paymentStatus !== "Paid 100%" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[#E07B00] hover:text-[#E07B00] hover:bg-orange-50 text-[12px]" onClick={() => openClientPay(inv)}>
                              <DollarSign size={12} />Pay
                            </Button>
                          )}
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

      {mainTab === "demo" && (
        <>
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
        </>
      )}

      {/* Demo Record Payment Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Record Payment</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label>Invoice</Label>
              <Select onValueChange={(v) => setValue("invoiceId", v as string)}>
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

      {/* Client Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment — {payDialog?.invoiceRef}</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px] space-y-1">
                <div className="flex justify-between"><span className="text-[#6A788D]">Vendor:</span><span className="font-semibold">{payDialog.vendorName}</span></div>
                <div className="flex justify-between"><span className="text-[#6A788D]">PO Ref:</span><span className="font-mono text-[12px]">{payDialog.poRef}</span></div>
                <div className="flex justify-between"><span className="text-[#6A788D]">Invoice Amount:</span><span className="font-bold">{formatSAR(payDialog.invoiceAmountWithVat)}</span></div>
                <div className="flex justify-between"><span className="text-[#6A788D]">Pending:</span><span className="font-bold text-[#C0453F]">{formatSAR(payDialog.invoiceAmountWithVat - payDialog.paidAmount)}</span></div>
              </div>
              <div className="grid gap-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Paid Amount (SAR)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Reference Number</Label>
                <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Bank TXN / CHQ ref" />
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button className="flex-1 text-white" style={{ background: "#E07B00" }} onClick={handleClientPayment}>Mark as Paid</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
