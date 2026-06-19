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
import type { ClientVendor } from "@/lib/client-data/types";

const CATEGORIES = ["TSF", "Safety Equipments", "Consumables", "Electrical", "Civil", "Mechanical", "IT", "Logistics", "General"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VendorFormSheet({ open, onClose }: Props) {
  const { addClientVendor, addClientActivity } = useClientData();

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  function resetForm() {
    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setCategory("");
    setAddress("");
    setNotes("");
  }

  function validate() {
    if (!name.trim()) { toast.error("Vendor name is required"); return false; }
    if (!category) { toast.error("Category is required"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const vendor: ClientVendor = {
      id: `cvnd-${Date.now()}`,
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category,
      address: address.trim(),
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addClientVendor(vendor);
    addClientActivity({
      action: "add_vendor",
      description: `Added vendor ${name} (${category})`,
      referenceId: vendor.id,
      referenceRef: name,
      performedBy: "Ali Khan",
    });
    toast.success(`Vendor "${name}" added`);
    setSaving(false);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <SheetTitle>Add Vendor</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Vendor Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
          </div>

          <div className="grid gap-1.5">
            <Label>Category / Discipline *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="text-[12px] font-semibold text-[#6A788D] uppercase tracking-wider">Contact</div>

          <div className="grid gap-1.5">
            <Label>Contact Person</Label>
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@vendor.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966..." />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Address</Label>
            <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Country" />
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
              {saving ? "Saving…" : "Add Vendor"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
