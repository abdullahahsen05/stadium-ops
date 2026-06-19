"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useClientData } from "@/lib/client-data/client-context";
import { formatSAR } from "@/lib/client-data/utils";
import type { ClientInvoice } from "@/lib/client-data/types";

const PAYMENT_METHODS = ["Bank Transfer", "SADAD", "Wire Transfer", "Cheque", "Letter of Credit", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  prefillInvoice?: ClientInvoice;
}

function safeNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function PaymentFormDialog({ open, onClose, prefillInvoice }: Props) {
  const { clientInvoices, applyMutation, addClientActivity } = useClientData();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmtStr, setPayAmtStr] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedInvoice = prefillInvoice || clientInvoices.find((i) => i.id === selectedInvoiceId);
  const pending = selectedInvoice
    ? Math.max(0, selectedInvoice.invoiceAmountWithVat - selectedInvoice.paidAmount)
    : 0;

  useEffect(() => {
    if (open) {
      setPayDate(new Date().toISOString().split("T")[0]);
      setPayRef("");
      setPayMethod("Bank Transfer");
      setNotes("");
      if (prefillInvoice) {
        setSelectedInvoiceId(prefillInvoice.id);
        setPayAmtStr(Math.max(0, prefillInvoice.invoiceAmountWithVat - prefillInvoice.paidAmount).toFixed(2));
      } else {
        setSelectedInvoiceId("");
        setPayAmtStr("");
      }
    }
  }, [open, prefillInvoice]);

  // When invoice is selected (non-prefill), update default amount
  useEffect(() => {
    if (!prefillInvoice && selectedInvoiceId) {
      const inv = clientInvoices.find((i) => i.id === selectedInvoiceId);
      if (inv) {
        setPayAmtStr(Math.max(0, inv.invoiceAmountWithVat - inv.paidAmount).toFixed(2));
      }
    }
  }, [selectedInvoiceId, clientInvoices, prefillInvoice]);

  function validate() {
    if (!selectedInvoice) { toast.error("Please select an invoice"); return false; }
    if (!payRef.trim()) { toast.error("Reference number is required"); return false; }
    const amt = safeNum(payAmtStr);
    if (amt <= 0) { toast.error("Payment amount must be greater than 0"); return false; }
    if (amt > selectedInvoice.invoiceAmountWithVat) {
      toast.error("Cannot exceed total invoice amount");
      return false;
    }
    return true;
  }

  function handlePay() {
    if (!validate() || !selectedInvoice) return;
    setSaving(true);

    const amt = safeNum(payAmtStr);
    applyMutation({
      invoiceId: selectedInvoice.id,
      paidAmount: amt,
      paymentReceivedDate: payDate,
      paymentStatus: "Paid 100%", // computed in context via computePaymentStatus
      referenceNumber: payRef.trim(),
      notes: notes.trim(),
    });
    addClientActivity({
      action: "payment",
      description: `Payment ${formatSAR(amt)} for ${selectedInvoice.invoiceRef} — ref: ${payRef}`,
      referenceId: selectedInvoice.id,
      referenceRef: selectedInvoice.invoiceRef,
      performedBy: "Ali Khan",
    });
    toast.success(`Payment of ${formatSAR(amt)} recorded for ${selectedInvoice.invoiceRef}`);

    setSaving(false);
    onClose();
  }

  const unpaidInvoices = clientInvoices.filter((i) => i.paymentStatus !== "Paid 100%");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] p-7">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-[17px]">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Invoice selection (only when no prefill) */}
          {!prefillInvoice && (
            <div className="grid gap-2">
              <Label className="text-[13px]">Invoice *</Label>
              <Select value={selectedInvoiceId} onValueChange={(v) => setSelectedInvoiceId(v ?? "")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {unpaidInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceRef} — {inv.vendorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Invoice summary */}
          {selectedInvoice && (
            <div className="bg-[#F8F9FC] rounded-xl p-4 text-[13px] space-y-2 border border-[#E3E8F0]">
              <div className="flex justify-between">
                <span className="text-[#6A788D]">Invoice</span>
                <span className="font-semibold font-mono">{selectedInvoice.invoiceRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A788D]">Vendor</span>
                <span className="font-semibold">{selectedInvoice.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A788D]">Invoice Amount</span>
                <span className="font-semibold">{formatSAR(selectedInvoice.invoiceAmountWithVat)}</span>
              </div>
              {selectedInvoice.paidAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6A788D]">Already Paid</span>
                  <span className="font-semibold text-[#1E8E55]">{formatSAR(selectedInvoice.paidAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E3E8F0] pt-2 mt-1">
                <span className="text-[#6A788D] font-semibold">Outstanding</span>
                <span className="font-bold text-[#C8901F] text-[14px]">{formatSAR(pending)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-[13px]">Payment Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px]">Amount (SAR) *</Label>
              <Input
                type="number"
                value={payAmtStr}
                onChange={(e) => setPayAmtStr(e.target.value)}
                placeholder="0.00"
                step="0.01"
                max={pending}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">Reference Number *</Label>
            <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN / Bank ref / Cheque no." className="h-10" />
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">Payment Method</Label>
            <Select value={payMethod} onValueChange={(v) => setPayMethod(v ?? "Bank Transfer")}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
          </div>

          <div className="text-[12px] text-[#6A788D] bg-[#F8F9FC] border border-[#E3E8F0] rounded-lg px-4 py-3">
            Partial payment → <strong>Partially Paid</strong> · Full amount → <strong>Paid 100%</strong>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 h-10" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              className="flex-1 h-10 text-white"
              style={{ background: "#1E8E55" }}
              onClick={handlePay}
              disabled={saving}
            >
              {saving ? "Processing…" : "Record Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
