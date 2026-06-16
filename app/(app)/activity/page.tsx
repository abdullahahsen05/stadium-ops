"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/ui-custom/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Search, Activity } from "lucide-react";
import { format } from "date-fns";
import type { ActivityModule } from "@/lib/types";

const modules: ActivityModule[] = ["Inventory", "Purchase Order", "Delivery", "Invoice", "Payment", "Vendor", "Debris", "Alert", "Settings"];

const moduleColors: Record<string, string> = {
  "Invoice": "#1968D3",
  "Delivery": "#1E8E55",
  "Purchase Order": "#E07B00",
  "Payment": "#1E8E55",
  "Alert": "#C0453F",
  "Vendor": "#C8901F",
  "Inventory": "#8B5CF6",
  "Debris": "#6A788D",
  "Settings": "#9AA6B6",
};

const actionLabels: Record<string, string> = {
  created: "Created", updated: "Updated", deleted: "Deleted",
  approved: "Approved", rejected: "Rejected", paid: "Paid",
  received: "Received", acknowledged: "Acknowledged", resolved: "Resolved",
  sent: "Sent to Vendor", reset: "Reset",
};

export default function ActivityPage() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const filtered = state.activity.filter((a) => {
    const matchSearch = a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.performedBy.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || a.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Activity Log"
        subtitle="Complete audit trail of all actions performed in StadiumOps."
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
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
              const color = moduleColors[act.module] ?? "#6A788D";
              const isLast = idx === filtered.length - 1;
              return (
                <div key={act.id} className={`flex items-start gap-4 px-6 py-4 hover:bg-[#F8F9FC] transition-colors ${!isLast ? "border-b border-[#F0F3F8]" : ""}`}>
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
                            {act.module}
                          </span>
                          <span className="text-[11.5px] font-semibold text-[#6A788D]">{actionLabels[act.action] ?? act.action}</span>
                          <span className="font-mono-id text-[11.5px] text-[#9AA6B6]">{act.referenceNumber}</span>
                        </div>
                        <div className="text-[13px] font-medium text-[#14223B] leading-snug">{act.description}</div>
                      </div>
                      <div className="text-right flex-none">
                        <div className="text-[12px] font-semibold text-[#14223B]">{act.performedBy}</div>
                        <div className="text-[11px] text-[#9AA6B6]">{act.role}</div>
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
