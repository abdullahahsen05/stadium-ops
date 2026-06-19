"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useClientData } from "@/lib/client-data/client-context";
import type { ClientInvoice, ClientPO } from "@/lib/client-data/types";

const PAYMENT_STATUSES = ["To be Processed", "Invoice sent to HO", "Partially Paid", "Paid 100%"];
const VAT_RATE = 0.15;

interface Props {
  open: boolean;
  onClose: () => void;
  /** If provided, form is in edit mode */
  editInvoice?: ClientInvoice;
  /** Pre-select a PO when opening from PO drawer */
  prefillPO?: ClientPO;
}

function safeNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function InvoiceFormSheet({ open, onClose, editInvoice, prefillPO }: Props) {
  const { clientPOs, clientInvoices, addClientInvoice, applyInvoiceEdit, addClientActivity } = useClientData();
  const isEdit = !!editInvoice;

  const [selectedPOId, setSelectedPOId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceAmtStr, setInvoiceAmtStr] = useState("");
  const [payReqAmtStr, setPayReqAmtStr] = useState("");
  const [payReqDate, setPayReqDate] = useState("");
  const [creditDaysStr, setCreditDaysStr] = useState("60");
  const [dueDate, setDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("To be Processed");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editInvoice) {
      setSelectedPOId(editInvoice.cpoId);
      setVendorName(editInvoice.vendorName);
      setInvoiceRef(editInvoice.invoiceRef);
      setInvoiceDate(editInvoice.invoiceDate);
      setInvoiceAmtStr(String(editInvoice.invoiceAmountWithVat));
      setPayReqAmtStr(String(editInvoice.paymentRequestedAmount));
      setPayReqDate(editInvoice.paymentRequestedDate || "");
      setCreditDaysStr(String(editInvoice.creditDays || 60));
      setDueDate(editInvoice.dueDate || "");
      setPaymentStatus(editInvoice.paymentStatus);
      setNotes(editInvoice.notes || "");
    } else if (prefillPO) {
      setSelectedPOId(prefillPO.id);
      setVendorName(prefillPO.vendorName);
    } else {
      resetForm();
    }
  }, [editInvoice, prefillPO, open]);

  // Auto-fill vendor from PO selection
  useEffect(() => {
    if (!isEdit && selectedPOId) {
      const po = clientPOs.find((p) => p.id === selectedPOId);
      if (po) setVendorName(po.vendorName);
    }
  }, [selectedPOId, clientPOs, isEdit]);

  // Auto-calculate due date from invoice date + credit days
  useEffect(() => {
    if (invoiceDate && creditDaysStr) {
      const days = parseInt(creditDaysStr, 10);
      if (!isNaN(days)) setDueDate(addDays(invoiceDate, days));
    }
  }, [invoiceDate, creditDaysStr]);

  // Default payment requested amount to invoice amount
  useEffect(() => {
    if (!isEdit && invoiceAmtStr && !payReqAmtStr) {
      setPayReqAmtStr(invoiceAmtStr);
    }
  }, [invoiceAmtStr, isEdit]);

  function resetForm() {
    setSelectedPOId("");
    setVendorName("");
    setInvoiceRef("");
    setInvoiceDate("");
    setInvoiceAmtStr("");
    setPayReqAmtStr("");
    setPayReqDate("");
    setCreditDaysStr("60");
    setDueDate("");
    setPaymentStatus("To be Processed");
    setNotes("");
  }

  function validate() {
    if (!vendorName.trim()) { toast.error("Vendor is required"); return false; }
    if (!invoiceRef.trim()) { toast.error("Invoice reference is required"); return false; }
    if (!invoiceDate) { toast.error("Invoice date is required"); return false; }
    const amt = safeNum(invoiceAmtStr);
    if (amt <= 0) { toast.error("Invoice amount must be greater than 0"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const invoiceAmt = safeNum(invoiceAmtStr);
    const payReqAmt = payReqAmtStr ? safeNum(payReqAmtStr) : invoiceAmt;
    const selectedPO = clientPOs.find((p) => p.id === selectedPOId);

    if (isEdit && editInvoice) {
      applyInvoiceEdit({
        invoiceId: editInvoice.id,
        invoiceRef: invoiceRef.trim(),
        invoiceDate,
        invoiceAmountWithVat: invoiceAmt,
        paymentRequestedAmount: payReqAmt,
        paymentRequestedDate: payReqDate,
        creditDays: parseInt(creditDaysStr, 10) || 60,
        dueDate,
        paymentStatus,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      addClientActivity({
        action: "edit_invoice",
        description: `Edited invoice ${invoiceRef} — amount: SAR ${invoiceAmt.toLocaleString()}`,
        referenceId: editInvoice.id,
        referenceRef: invoiceRef,
        performedBy: "Ali Khan",
      });
      toast.success(`Invoice ${invoiceRef} updated`);
    } else {
      const newInvoice: ClientInvoice = {
        id: `cinv-new-${Date.now()}`,
        sl: clientInvoices.length + 1,
        cpoId: selectedPOId || "",
        poRef: selectedPO?.poRef || "",
        vendorName: vendorName.trim(),
        poAmount: selectedPO?.amountWithoutVatSar || 0,
        poAmountWithVat: selectedPO?.amountWithVatSar || 0,
        invoiceAmountWithVat: invoiceAmt,
        invoiceRef: invoiceRef.trim(),
        invoiceDate,
        paymentRequestedAmount: payReqAmt,
        paymentRequestedDate: payReqDate,
        paidAmount: 0,
        paymentReceivedDate: "",
        paymentStatus,
        creditDays: parseInt(creditDaysStr, 10) || 60,
        dueDate,
        notes: notes.trim() || undefined,
      };
      addClientInvoice(newInvoice);
      addClientActivity({
        action: "add_invoice",
        description: `Added invoice ${invoiceRef} for ${vendorName} — SAR ${invoiceAmt.toLocaleString()}`,
        referenceId: newInvoice.id,
        referenceRef: invoiceRef,
        performedBy: "Ali Khan",
      });
      toast.success(`Invoice ${invoiceRef} added`);
    }

    setSaving(false);
    resetForm();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit Invoice" : "Add Invoice"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* PO + Vendor */}
          <div className="grid gap-1.5">
            <Label>Related Purchase Order</Label>
            <Select value={selectedPOId} onValueChange={(v) => setSelectedPOId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={isEdit ? "— (leave to keep)" : "Select PO (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {clientPOs.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poRef} — {po.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Vendor *</Label>
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Vendor name"
            />
          </div>

          <Separator />

          {/* Invoice core */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Invoice Reference *</Label>
              <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="INV-001" />
            </div>
            <div className="grid gap-1.5">
              <Label>Invoice Date *</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Invoice Amount with VAT (SAR) *</Label>
            <Input
              type="number"
              value={invoiceAmtStr}
              onChange={(e) => setInvoiceAmtStr(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            {safeNum(invoiceAmtStr) > 0 && (
              <p className="text-[11px] text-[#6A788D]">
                ≈ Ex-VAT: SAR {(safeNum(invoiceAmtStr) / (1 + VAT_RATE)).toLocaleString("en-SA", { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <Separator />

          {/* Payment request */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Payment Requested Amount</Label>
              <Input
                type="number"
                value={payReqAmtStr}
                onChange={(e) => setPayReqAmtStr(e.target.value)}
                placeholder="Defaults to invoice amount"
                step="0.01"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Payment Requested Date</Label>
              <Input type="date" value={payReqDate} onChange={(e) => setPayReqDate(e.target.value)} />
            </div>
          </div>

          {/* Credit + due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Credit Days</Label>
              <Select value={creditDaysStr} onValueChange={(v) => setCreditDaysStr(v ?? "60")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["30", "45", "60", "90", "120"].map((d) => (
                    <SelectItem key={d} value={d}>{d} days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="grid gap-1.5">
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v ?? "To be Processed")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              className="flex-1 text-white"
              style={{ background: "#E07B00" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Invoice"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
