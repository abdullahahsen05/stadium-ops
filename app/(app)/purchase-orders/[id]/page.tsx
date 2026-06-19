"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { useClientData } from "@/lib/client-data/client-context";
import { formatPKR } from "@/lib/store";
import { formatSAR, getPaymentStatusColor, getPaymentStatusBg, isOverdue, isDueSoon } from "@/lib/client-data/utils";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Building2, MapPin, Calendar, Package, Truck, Receipt, CreditCard, CheckCircle, Clock, AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ClientRecord } from "@/lib/client-data/types";

function TimelineStep({ label, date, done, active, danger }: { label: string; date?: string; done: boolean; active?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-none border-2 transition-colors ${done ? "bg-[#1E8E55] border-[#1E8E55]" : danger ? "border-[#C0453F] bg-red-50" : active ? "border-[#E07B00] bg-orange-50" : "border-[#E3E8F0] bg-white"}`}>
          {done ? <CheckCircle size={14} className="text-white" /> : <div className={`w-2.5 h-2.5 rounded-full ${danger ? "bg-[#C0453F]" : active ? "bg-[#E07B00]" : "bg-[#CBD2DE]"}`} />}
        </div>
        <div className="w-px h-8 bg-[#E3E8F0] mt-1" />
      </div>
      <div className="pb-6">
        <div className={`text-[13px] font-semibold ${done ? "text-[#1E8E55]" : danger ? "text-[#C0453F]" : active ? "text-[#E07B00]" : "text-[#6A788D]"}`}>{label}</div>
        {date && <div className="text-[11.5px] text-[#6A788D] mt-0.5">{date}</div>}
      </div>
    </div>
  );
}

function ClientPODetail({ record }: { record: ClientRecord }) {
  const { applyMutation } = useClientData();
  const [payDialog, setPayDialog] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState(record.invoice.invoiceAmountWithVat.toFixed(2));
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const { po, invoice, pendingAmount } = record;
  const ov = isOverdue(invoice.dueDate) && invoice.paymentStatus !== "Paid 100%";
  const soon = isDueSoon(invoice.dueDate) && invoice.paymentStatus !== "Paid 100%";

  function handleRecordPayment() {
    if (!payRef.trim()) {
      toast.error("Reference number is required");
      return;
    }
    applyMutation({
      invoiceId: invoice.id,
      paidAmount: Number(payAmount),
      paymentReceivedDate: payDate,
      paymentStatus: "Paid 100%",
      referenceNumber: payRef,
      notes: payNotes,
    });
    toast.success(`Payment recorded for ${invoice.invoiceRef}`);
    setPayDialog(false);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/purchase-orders">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={15} />Back to Purchase Orders
          </Button>
        </Link>
        <div className="h-4 w-px bg-[#E3E8F0]" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-[#14223B] tracking-tight font-mono text-[12px]">{po.poRef}</h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ color: "#1968D3", background: "#EFF6FF" }}
            >
              {po.discipline}
            </span>
          </div>
          <p className="text-[13px] text-[#6A788D] mt-0.5">{po.vendorName} · {po.initiatedBy}</p>
        </div>
        {invoice.paymentStatus !== "Paid 100%" && (
          <Button onClick={() => setPayDialog(true)} style={{ background: "#1E8E55" }} className="text-white gap-1.5">
            <DollarSign size={14} />Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="flex flex-col gap-5">
          {/* PO Header Card */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Purchase Order Details</div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "PO Reference", value: po.poRef, mono: true },
                { label: "Vendor", value: po.vendorName },
                { label: "Initiated By", value: po.initiatedBy },
                { label: "Date Issued", value: po.dateIssued },
                { label: "Discipline", value: po.discipline },
                { label: "INCO Term", value: po.incoTerm },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">{label}</div>
                  <div className={`text-[13px] font-semibold text-[#14223B] ${mono ? "font-mono text-[12px]" : ""}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#F8F9FC] rounded-lg mb-4">
              <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Description</div>
              <div className="text-[13px] text-[#14223B]">{po.description}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">PO Amount</div>
                <div className="text-[16px] font-bold text-[#14223B]">{formatSAR(po.poAmount)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Amount w/ VAT</div>
                <div className="text-[16px] font-bold text-[#E07B00]">{formatSAR(po.amountWithVatSar)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Payment Term</div>
                <div className="text-[13px] font-semibold text-[#14223B]">{po.paymentTerm}</div>
              </div>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-[#14223B]">Invoice Details</div>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ color: getPaymentStatusColor(invoice.paymentStatus), background: getPaymentStatusBg(invoice.paymentStatus) }}
              >
                {invoice.paymentStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Invoice Ref", value: invoice.invoiceRef, mono: true },
                { label: "Invoice Date", value: invoice.invoiceDate || "—" },
                { label: "Invoice Amount w/ VAT", value: formatSAR(invoice.invoiceAmountWithVat) },
                { label: "Payment Requested", value: invoice.paymentRequestedAmount > 0 ? formatSAR(invoice.paymentRequestedAmount) : "—" },
                { label: "Requested Date", value: invoice.paymentRequestedDate || "—" },
                { label: "Credit Days", value: `${invoice.creditDays} days` },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">{label}</div>
                  <div className={`text-[13px] font-semibold text-[#14223B] ${mono ? "font-mono text-[12px]" : ""}`}>{value}</div>
                </div>
              ))}
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Due Date</div>
                <div className={`text-[13px] font-semibold ${ov ? "text-[#C0453F]" : soon ? "text-[#C8901F]" : "text-[#14223B]"}`}>
                  {invoice.dueDate}{ov ? " (Overdue)" : soon ? " (Due Soon)" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Payment Details</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Paid Amount</div>
                <div className="text-[20px] font-bold text-[#1E8E55]">{formatSAR(invoice.paidAmount)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Pending Amount</div>
                <div className={`text-[20px] font-bold ${pendingAmount > 0 ? "text-[#C8901F]" : "text-[#1E8E55]"}`}>{formatSAR(pendingAmount)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">Payment Received Date</div>
                <div className="text-[13px] font-semibold text-[#14223B]">{invoice.paymentReceivedDate || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Timeline */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Timeline</div>
            <TimelineStep label="PO Issued" date={po.dateIssued} done={!!po.dateIssued} />
            <TimelineStep label="Invoice Received" date={invoice.invoiceDate} done={!!invoice.invoiceDate} active={!invoice.invoiceDate} />
            <TimelineStep label="Payment Requested" date={invoice.paymentRequestedDate} done={!!invoice.paymentRequestedDate} active={!!invoice.invoiceDate && !invoice.paymentRequestedDate} />
            <TimelineStep
              label="Due Date"
              date={invoice.dueDate}
              done={invoice.paymentStatus === "Paid 100%"}
              danger={ov}
              active={soon && invoice.paymentStatus !== "Paid 100%"}
            />
            <TimelineStep
              label="Payment Received"
              date={invoice.paymentReceivedDate || undefined}
              done={invoice.paymentStatus === "Paid 100%" && !!invoice.paymentReceivedDate}
              active={false}
            />
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px]">
              <div className="flex justify-between"><span className="text-[#6A788D]">Invoice:</span><span className="font-mono font-semibold">{invoice.invoiceRef}</span></div>
              <div className="flex justify-between mt-1"><span className="text-[#6A788D]">Invoice Amount:</span><span className="font-bold">{formatSAR(invoice.invoiceAmountWithVat)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-[#6A788D]">Outstanding:</span><span className="font-bold text-[#C0453F]">{formatSAR(pendingAmount)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Paid Amount (SAR)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Reference Number</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN / Transfer ref..." />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPayDialog(false)}>Cancel</Button>
              <Button className="flex-1 text-white" style={{ background: "#1E8E55" }} onClick={handleRecordPayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, updatePurchaseOrder, addActivity } = useApp();
  const { clientRecords } = useClientData();

  // Handle client PO ids (cpo-xx)
  if (typeof id === "string" && id.startsWith("cpo-")) {
    const record = clientRecords.find((r) => r.po.id === id);
    if (!record) return <div className="p-8 text-[#6A788D]">Client purchase order not found.</div>;
    return <ClientPODetail record={record} />;
  }

  // Demo PO detail
  const po = state.purchaseOrders.find((p) => p.id === id);
  if (!po) return <div className="p-8 text-[#6A788D]">Purchase order not found.</div>;
  const purchaseOrder = po;

  const vendor = state.vendors.find((v) => v.id === purchaseOrder.vendorId);
  const linkedDeliveries = state.deliveries.filter((d) => d.poId === purchaseOrder.id);
  const linkedInvoices = state.invoices.filter((inv) => inv.poId === purchaseOrder.id);
  const linkedPayments = state.payments.filter((pay) => linkedInvoices.some((inv) => inv.id === pay.invoiceId));
  const linkedActivity = state.activity.filter((a) => a.referenceId === purchaseOrder.id || linkedDeliveries.some((d) => d.id === a.referenceId));

  function markSent() {
    updatePurchaseOrder(purchaseOrder.id, { status: "Sent", sentDate: new Date().toISOString().split("T")[0] });
    addActivity({ module: "Purchase Order", action: "sent", description: `Sent ${purchaseOrder.poNumber} to ${purchaseOrder.vendorName}`, referenceId: purchaseOrder.id, referenceNumber: purchaseOrder.poNumber, performedBy: "Ali Khan", role: "Procurement Officer" });
    toast.success(`${purchaseOrder.poNumber} marked as sent to vendor`);
  }

  const timelineSteps = [
    { label: "PO Created", date: purchaseOrder.createdDate, done: true },
    { label: "Sent to Vendor", date: purchaseOrder.sentDate, done: !!purchaseOrder.sentDate },
    { label: "Delivery Due", date: purchaseOrder.expectedDeliveryDate, done: ["Partial", "Delivered", "Completed"].includes(purchaseOrder.status) },
    { label: "Delivery Received", date: linkedDeliveries[0]?.receivedDate, done: ["Delivered", "Completed"].includes(purchaseOrder.status) || linkedDeliveries.length > 0 },
    { label: "Invoice Received", date: linkedInvoices[0]?.invoiceDate, done: linkedInvoices.length > 0 },
    { label: "Payment Due", date: linkedInvoices[0]?.dueDate, done: linkedPayments.length > 0 },
    { label: "Paid", date: linkedPayments[0]?.paymentDate, done: linkedInvoices.every((inv) => inv.status === "Paid") },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft size={15} />Back
        </Button>
        <div className="h-4 w-px bg-[#E3E8F0]" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#14223B] tracking-tight font-mono-id">{purchaseOrder.poNumber}</h1>
            <StatusBadge status={purchaseOrder.status} />
          </div>
          <p className="text-[13px] text-[#6A788D] mt-0.5">{purchaseOrder.vendorName} · {purchaseOrder.zone}</p>
        </div>
        <div className="flex items-center gap-2">
          {purchaseOrder.status === "Draft" && (
            <Button onClick={markSent} style={{ background: "#E07B00" }} className="text-white gap-1.5">
              <Truck size={14} />Mark as Sent
            </Button>
          )}
          <Link href="/deliveries">
            <Button variant="outline" className="gap-1.5"><Truck size={14} />Record Delivery</Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" className="gap-1.5"><Receipt size={14} />Add Invoice</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="flex flex-col gap-5">
          {/* PO Details */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Order Details</div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { icon: Building2, label: "Vendor", value: purchaseOrder.vendorName },
                { icon: MapPin, label: "Site Zone", value: purchaseOrder.zone },
                { icon: Calendar, label: "Created", value: purchaseOrder.createdDate },
                { icon: Calendar, label: "Expected Delivery", value: purchaseOrder.expectedDeliveryDate },
                { icon: Package, label: "Total Amount", value: formatPKR(purchaseOrder.totalAmount) },
                { icon: Calendar, label: "Sent Date", value: purchaseOrder.sentDate ?? "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6A788D] uppercase tracking-[0.08em] mb-1">
                    <Icon size={11} />
                    {label}
                  </div>
                  <div className="text-[13.5px] font-semibold text-[#14223B]">{value}</div>
                </div>
              ))}
            </div>
            {purchaseOrder.notes && (
              <div className="p-3 bg-[#F8F9FC] rounded-lg text-[12.5px] text-[#6A788D]">
                <span className="font-semibold text-[#14223B]">Notes: </span>{purchaseOrder.notes}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="px-5 py-4 border-b border-[#E3E8F0]">
              <div className="text-[13px] font-semibold text-[#14223B]">Order Items</div>
            </div>
            <table className="w-full text-[12.5px]">
              <thead className="bg-[#F8F9FC]">
                <tr className="border-b border-[#E3E8F0]">
                  {["Material", "Ordered Qty", "Delivered Qty", "Remaining", "Unit Cost", "Subtotal", "Progress"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-[#6A788D]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.items.map((item, idx) => {
                  const remaining = item.quantity - item.deliveredQty;
                  const pct = item.quantity > 0 ? Math.round((item.deliveredQty / item.quantity) * 100) : 0;
                  return (
                    <tr key={idx} className="border-b border-[#F0F3F8]">
                      <td className="py-3 px-4 font-medium text-[#14223B]">{item.materialName}</td>
                      <td className="py-3 px-4 font-mono-id">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono-id text-[#1E8E55]">{item.deliveredQty.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono-id text-[#C8901F]">{remaining.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono-id">{formatPKR(item.unitCost)}</td>
                      <td className="py-3 px-4 font-semibold font-mono-id">{formatPKR(item.quantity * item.unitCost)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-[5px] bg-[#F0F3F8] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#1E8E55]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11.5px] text-[#6A788D]">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#F8F9FC]">
                  <td colSpan={5} className="py-3 px-4 text-right font-bold text-[#14223B]">Total</td>
                  <td className="py-3 px-4 font-bold font-mono-id text-[#14223B]">{formatPKR(purchaseOrder.totalAmount)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Linked Deliveries */}
          {linkedDeliveries.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
              <div className="text-[13px] font-semibold text-[#14223B] mb-3">Linked Deliveries</div>
              {linkedDeliveries.map((d) => (
                <div key={d.id} className="flex items-center gap-4 py-2.5 border-b border-[#F0F3F8] last:border-0">
                  <Truck size={14} className="text-[#6A788D] flex-none" />
                  <span className="font-mono-id text-[#6A788D]">{d.deliveryNumber}</span>
                  <span className="text-[#14223B] font-medium flex-1">{d.materialName}</span>
                  <span className="text-[#14223B] font-mono-id">{d.deliveredQty.toLocaleString()} units</span>
                  <span className="text-[#6A788D]">{d.receivedDate || "—"}</span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}

          {/* Linked Invoices */}
          {linkedInvoices.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
              <div className="text-[13px] font-semibold text-[#14223B] mb-3">Linked Invoices</div>
              {linkedInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 py-2.5 border-b border-[#F0F3F8] last:border-0">
                  <Receipt size={14} className="text-[#6A788D] flex-none" />
                  <span className="font-mono-id text-[#6A788D]">{inv.invoiceNumber}</span>
                  <span className="text-[#14223B] font-semibold flex-1">{formatPKR(inv.totalAmount)}</span>
                  <span className="text-[#6A788D]">Due: {inv.dueDate}</span>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Timeline + Activity */}
        <div className="flex flex-col gap-4">
          {/* PO Lifecycle Timeline */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">PO Lifecycle</div>
            {timelineSteps.map((step, idx) => (
              <TimelineStep key={idx} label={step.label} date={step.date} done={step.done} active={!step.done && timelineSteps[idx - 1]?.done} />
            ))}
          </div>

          {/* Activity */}
          {linkedActivity.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E3E8F0] p-5" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
              <div className="text-[13px] font-semibold text-[#14223B] mb-3">Activity</div>
              <div className="flex flex-col gap-3">
                {linkedActivity.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="flex-none mt-1 w-1.5 h-1.5 rounded-full bg-[#E07B00]" />
                    <div>
                      <div className="text-[12px] text-[#14223B] leading-snug">{act.description}</div>
                      <div className="text-[11px] text-[#6A788D] mt-0.5">{act.performedBy} · {format(new Date(act.timestamp), "MMM d, h:mm a")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
