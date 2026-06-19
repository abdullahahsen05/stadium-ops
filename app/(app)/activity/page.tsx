"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { PageHeader } from "@/components/ui-custom/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Search, Activity } from "lucide-react";
import { format } from "date-fns";

function getModule(action: string): string {
  if (action.includes("_po") || action === "add_po" || action === "edit_po" || action === "delete_po") return "Purchase Order";
  if (action.includes("_invoice") || action === "add_invoice" || action === "edit_invoice" || action === "delete_invoice") return "Invoice";
  if (action === "payment" || action === "record_payment") return "Payment";
  if (action.includes("_vendor") || action === "add_vendor" || action === "delete_vendor") return "Vendor";
  if (action.includes("_alert") || action === "acknowledge_alert" || action === "resolve_alert") return "Alert";
  if (action === "data_import" || action === "system_init" || action === "system_check") return "System";
  return "General";
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    add_po: "Created", edit_po: "Updated", delete_po: "Deleted",
    add_invoice: "Created", edit_invoice: "Updated", delete_invoice: "Deleted",
    payment: "Recorded", record_payment: "Recorded",
    add_vendor: "Added", delete_vendor: "Deleted",
    acknowledge_alert: "Acknowledged", resolve_alert: "Resolved",
    data_import: "Imported", system_init: "Initialized", system_check: "System Check",
  };
  return labels[action] ?? action.replace(/_/g, " ");
}

const moduleColors: Record<string, string> = {
  "Invoice": "#1968D3",
  "Purchase Order": "#E07B00",
  "Payment": "#1E8E55",
  "Alert": "#C0453F",
  "Vendor": "#C8901F",
  "System": "#8B5CF6",
  "General": "#6A788D",
};

const MODULES = ["Purchase Order", "Invoice", "Payment", "Vendor", "Alert", "System"];

export default function ActivityPage() {
  const { clientActivity } = useClientData();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filtered = clientActivity.filter((a) => {
    const mod = getModule(a.action);
    const matchSearch =
      search === "" ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      (a.referenceRef ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.performedBy.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || mod === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Activity Log"
        subtitle="Audit trail of all procurement actions — imports, edits, payments, and alerts."
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A788D]" />
          <Input placeholder="Search activity..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-[13px] text-[#6A788D]">{filtered.length} entries</div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E3E8F0] p-8">
          <EmptyState icon={Activity} title="No activity found" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <div className="flex flex-col">
            {filtered.map((act, idx) => {
              const mod = getModule(act.action);
              const color = moduleColors[mod] ?? "#6A788D";
              const isLast = idx === filtered.length - 1;
              const isSeed = act.id.startsWith("seed-");
              return (
                <div
                  key={act.id}
                  className={`flex items-start gap-4 px-6 py-4 hover:bg-[#F8F9FC] transition-colors ${!isLast ? "border-b border-[#F0F3F8]" : ""} ${isSeed ? "opacity-70" : ""}`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: color }} />
                    {!isLast && <div className="w-px flex-1 mt-2 min-h-[24px]" style={{ background: "#E3E8F0" }} />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                            {mod}
                          </span>
                          <span className="text-[11.5px] font-semibold text-[#6A788D]">{getActionLabel(act.action)}</span>
                          {act.referenceRef && (
                            <span className="font-mono text-[11.5px] text-[#9AA6B6]">{act.referenceRef}</span>
                          )}
                        </div>
                        <div className="text-[13px] font-medium text-[#14223B] leading-snug">{act.description}</div>
                      </div>
                      <div className="text-right flex-none">
                        <div className="text-[12px] font-semibold text-[#14223B]">{act.performedBy}</div>
                        {isSeed && <div className="text-[10.5px] text-[#9AA6B6]">System</div>}
                      </div>
                    </div>
                    <div className="text-[11.5px] text-[#9AA6B6] mt-1">
                      {format(new Date(act.timestamp), "MMM d, yyyy · h:mm a")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
