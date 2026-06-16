"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/ui-custom/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, RefreshCw, Info, Package, Calendar, DollarSign, Database } from "lucide-react";

export default function SettingsPage() {
  const { resetDemo, state } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    resetDemo();
    setConfirmReset(false);
  }

  const projectInfo = [
    { label: "Project Name", value: "National Stadium Construction" },
    { label: "Phase", value: "Phase 1 — Structural Works" },
    { label: "Project Start", value: "June 1, 2026" },
    { label: "Phase End Target", value: "December 31, 2026" },
    { label: "Default Currency", value: "PKR (Pakistani Rupee)" },
    { label: "Location", value: "Islamabad, Pakistan" },
  ];

  const businessRules = [
    { icon: Calendar, label: "Expected Delivery Date", value: "PO Created Date + 10 days" },
    { icon: Calendar, label: "Invoice Due Date", value: "Invoice Date + 10 days" },
    { icon: Package, label: "Low Stock Threshold", value: "Current Stock ≤ Reorder Level" },
    { icon: Package, label: "Critical Stock Threshold", value: "Current Stock ≤ 50% of Reorder Level" },
    { icon: DollarSign, label: "Overdue Invoice", value: "Unpaid invoice where Today > Due Date" },
    { icon: Calendar, label: "Due Soon Invoice", value: "Invoice due within 3 days" },
  ];

  const dataStats = [
    { label: "Materials", value: state.materials.length },
    { label: "Vendors", value: state.vendors.length },
    { label: "Purchase Orders", value: state.purchaseOrders.length },
    { label: "Deliveries", value: state.deliveries.length },
    { label: "Invoices", value: state.invoices.length },
    { label: "Payments", value: state.payments.length },
    { label: "Debris Records", value: state.debris.length },
    { label: "Alerts", value: state.alerts.length },
    { label: "Activity Entries", value: state.activity.length },
  ];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Settings"
        subtitle="Project configuration, business rules, and demo data management."
      />

      <div className="max-w-2xl flex flex-col gap-5">
        {/* Project Settings */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-6" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <Settings size={16} className="text-[#E07B00]" />
            <div className="text-[14px] font-semibold text-[#14223B]">Project Settings</div>
          </div>
          <div className="flex flex-col gap-3">
            {projectInfo.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#F0F3F8] last:border-0">
                <span className="text-[12.5px] text-[#6A788D] font-medium">{label}</span>
                <span className="text-[13px] font-semibold text-[#14223B]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Rules */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-6" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <Info size={16} className="text-[#1968D3]" />
            <div className="text-[14px] font-semibold text-[#14223B]">Business Rules</div>
          </div>
          <div className="flex flex-col gap-3">
            {businessRules.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2.5 border-b border-[#F0F3F8] last:border-0">
                <div className="flex-none w-8 h-8 rounded-lg bg-[#F5F7FB] flex items-center justify-center mt-0.5">
                  <Icon size={14} className="text-[#6A788D]" />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-[#14223B]">{label}</div>
                  <div className="text-[12px] text-[#6A788D] mt-0.5">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Data */}
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-6" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <Database size={16} className="text-[#8B5CF6]" />
            <div className="text-[14px] font-semibold text-[#14223B]">Demo Data</div>
          </div>

          <div className="p-4 bg-[#F5F7FB] rounded-lg mb-5 border border-[#E3E8F0]">
            <div className="flex items-center gap-2 mb-3">
              <span className="so-pulse w-2 h-2 rounded-full" style={{ background: "#E07B00" }} />
              <span className="text-[12px] font-bold text-[#14223B]">Demo Mode Active</span>
            </div>
            <p className="text-[12px] text-[#6A788D] leading-relaxed">
              All data is stored in your browser&apos;s localStorage. Changes persist during your session and across browser refreshes. No server, no database — purely client-side for this demo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {dataStats.map(({ label, value }) => (
              <div key={label} className="text-center p-3 bg-[#F8F9FC] rounded-lg border border-[#E3E8F0]">
                <div className="text-[18px] font-bold text-[#14223B]">{value}</div>
                <div className="text-[11px] text-[#6A788D] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E3E8F0] pt-5">
            <div className="text-[12.5px] text-[#6A788D] mb-3">
              Resetting will restore all demo data to its original state. Any changes you have made (new POs, deliveries, invoices etc.) will be lost.
            </div>
            <Button
              variant="outline"
              className="gap-2 text-[#C0453F] border-[#C0453F] hover:bg-red-50"
              onClick={() => setConfirmReset(true)}
            >
              <RefreshCw size={14} />Reset Demo Data
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Reset Demo Data?</DialogTitle></DialogHeader>
          <p className="text-[13px] text-[#6A788D] mt-2">
            This will reset all data to the original demo dataset. Any records you have created or modified will be permanently lost.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button className="flex-1 bg-[#C0453F] text-white hover:bg-red-700 gap-2" onClick={handleReset}>
              <RefreshCw size={14} />Yes, Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
