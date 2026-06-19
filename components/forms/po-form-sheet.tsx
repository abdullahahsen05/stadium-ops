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
import type { ClientPO } from "@/lib/client-data/types";

const VAT_RATE = 0.15;
const INCO_TERMS = ["EXW", "FOB", "CIF", "DDP", "DAP", "FCA", "CFR", "CPT"];
const PAYMENT_TERMS = ["Net 30", "Net 45", "Net 60", "Net 90", "50% Advance / 50% on delivery", "LC", "TT"];
const CURRENCIES = ["SAR", "USD", "EUR", "GBP", "AED", "PKR"];

interface Props {
  open: boolean;
  onClose: () => void;
  editPO?: ClientPO;
}

function safeNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function POFormSheet({ open, onClose, editPO }: Props) {
  const { clientPOs, clientVendors, addClientPO, applyPOEdit, addClientActivity } = useClientData();
  const isEdit = !!editPO;

  // Deduplicated vendor name suggestions
  const vendorSuggestions = Array.from(new Set([
    ...clientPOs.map((p) => p.vendorName),
    ...clientVendors.map((v) => v.name),
  ])).sort();

  const [poRef, setPoRef] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [initiatedBy, setInitiatedBy] = useState("");
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [currency, setCurrency] = useState("SAR");
  const [poAmtStr, setPoAmtStr] = useState("");
  const [amtNoVatStr, setAmtNoVatStr] = useState("");
  const [amtWithVatStr, setAmtWithVatStr] = useState("");
  const [incoTerm, setIncoTerm] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Get unique disciplines from existing POs
  const disciplines = Array.from(new Set(clientPOs.map((p) => p.discipline)));

  useEffect(() => {
    if (editPO) {
      setPoRef(editPO.poRef);
      setDiscipline(editPO.discipline);
      setVendorName(editPO.vendorName);
      setInitiatedBy(editPO.initiatedBy);
      setDateIssued(editPO.dateIssued);
      setDescription(editPO.description);
      setQuantity(editPO.quantity || "1");
      setCurrency(editPO.currency || "SAR");
      setPoAmtStr(String(editPO.poAmount));
      setAmtNoVatStr(String(editPO.amountWithoutVatSar));
      setAmtWithVatStr(String(editPO.amountWithVatSar));
      setIncoTerm(editPO.incoTerm || "");
      setPaymentTerm(editPO.paymentTerm || "");
      setNotes(editPO.notes || "");
    } else {
      resetForm();
    }
  }, [editPO, open]);

  // Auto-calculate VAT when amount without VAT changes
  useEffect(() => {
    if (!isEdit && amtNoVatStr) {
      const noVat = safeNum(amtNoVatStr);
      if (noVat > 0) {
        const withVat = noVat * (1 + VAT_RATE);
        setAmtWithVatStr(withVat.toFixed(2));
        setPoAmtStr(String(noVat));
      }
    }
  }, [amtNoVatStr, isEdit]);

  function resetForm() {
    setPoRef("");
    setDiscipline("");
    setVendorName("");
    setInitiatedBy("");
    setDateIssued(new Date().toISOString().split("T")[0]);
    setDescription("");
    setQuantity("1");
    setCurrency("SAR");
    setPoAmtStr("");
    setAmtNoVatStr("");
    setAmtWithVatStr("");
    setIncoTerm("");
    setPaymentTerm("");
    setNotes("");
  }

  function validate() {
    if (!isEdit && !poRef.trim()) { toast.error("PO Reference is required"); return false; }
    if (!discipline.trim()) { toast.error("Discipline is required"); return false; }
    if (!vendorName.trim()) { toast.error("Vendor is required"); return false; }
    if (!description.trim()) { toast.error("Description is required"); return false; }
    const withVat = safeNum(amtWithVatStr);
    if (withVat <= 0) { toast.error("PO Amount with VAT must be greater than 0"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const amtWithVat = safeNum(amtWithVatStr);
    const amtNoVat = safeNum(amtNoVatStr) || amtWithVat / (1 + VAT_RATE);
    const poAmt = safeNum(poAmtStr) || amtNoVat;

    if (isEdit && editPO) {
      applyPOEdit({
        poId: editPO.id,
        discipline: discipline.trim(),
        vendorName: vendorName.trim(),
        initiatedBy: initiatedBy.trim(),
        dateIssued,
        description: description.trim(),
        quantity: quantity.trim(),
        currency,
        poAmount: poAmt,
        amountWithoutVatSar: amtNoVat,
        amountWithVatSar: amtWithVat,
        incoTerm: incoTerm.trim() || undefined,
        paymentTerm: paymentTerm.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      addClientActivity({
        action: "edit_po",
        description: `Edited PO ${editPO.poRef} — ${vendorName} (${discipline})`,
        referenceId: editPO.id,
        referenceRef: editPO.poRef,
        performedBy: "Ali Khan",
      });
      toast.success(`PO ${editPO.poRef} updated`);
    } else {
      const newPO: ClientPO = {
        id: `cpo-new-${Date.now()}`,
        poRef: poRef.trim(),
        discipline: discipline.trim(),
        vendorName: vendorName.trim(),
        initiatedBy: initiatedBy.trim(),
        dateIssued,
        description: description.trim(),
        quantity: quantity.trim(),
        currency,
        xeConversion: 1,
        poAmount: poAmt,
        amountWithoutVatSar: amtNoVat,
        amountWithVatSar: amtWithVat,
        incoTerm: incoTerm.trim(),
        paymentTerm: paymentTerm.trim(),
        notes: notes.trim() || undefined,
      };
      addClientPO(newPO);
      addClientActivity({
        action: "add_po",
        description: `Created PO ${poRef} — ${vendorName} (${discipline}) SAR ${amtWithVat.toLocaleString()}`,
        referenceId: newPO.id,
        referenceRef: poRef,
        performedBy: "Ali Khan",
      });
      toast.success(`PO ${poRef} created`);
    }

    setSaving(false);
    resetForm();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? `Edit PO — ${editPO?.poRef}` : "Create Purchase Order"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* PO Ref (create only) */}
          {!isEdit && (
            <div className="grid gap-1.5">
              <Label>PO Reference *</Label>
              <Input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="PO-JED-001" />
            </div>
          )}

          {/* Discipline + Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Discipline *</Label>
              <Input
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="e.g. TSF, Electrical"
                list="discipline-list"
              />
              <datalist id="discipline-list">
                {disciplines.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <Label>Vendor *</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor name"
                list="vendor-list"
              />
              <datalist id="vendor-list">
                {vendorSuggestions.map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Initiated By</Label>
              <Input value={initiatedBy} onChange={(e) => setInitiatedBy(e.target.value)} placeholder="Name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Date Issued</Label>
              <Input type="date" value={dateIssued} onChange={(e) => setDateIssued(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Item Description *</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the items/services..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Quantity</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? "SAR")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Amounts */}
          <div className="text-[12px] font-semibold text-[#6A788D] uppercase tracking-wider">Amounts (SAR)</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>PO Amount</Label>
              <Input type="number" value={poAmtStr} onChange={(e) => setPoAmtStr(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
            <div className="grid gap-1.5">
              <Label>Ex-VAT (SAR)</Label>
              <Input type="number" value={amtNoVatStr} onChange={(e) => setAmtNoVatStr(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
            <div className="grid gap-1.5">
              <Label>With VAT (SAR) *</Label>
              <Input type="number" value={amtWithVatStr} onChange={(e) => setAmtWithVatStr(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
          </div>
          <p className="text-[11px] text-[#9AA6B6]">Enter Ex-VAT amount to auto-calculate with VAT at 15%.</p>

          <Separator />

          {/* Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>INCO Term</Label>
              <Select value={incoTerm} onValueChange={(v) => setIncoTerm(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {INCO_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Payment Term</Label>
              <Select value={paymentTerm} onValueChange={(v) => setPaymentTerm(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              className="flex-1 text-white"
              style={{ background: "#E07B00" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create PO"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
