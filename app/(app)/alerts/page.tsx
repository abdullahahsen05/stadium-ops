"use client";

import { useState } from "react";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import { formatSAR } from "@/lib/client-data/utils";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Bell, Clock, DollarSign, FileText } from "lucide-react";
import type { ClientAlert } from "@/lib/client-data/types";

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#C0453F", bg: "rgba(192,69,63,0.08)", label: "Critical" },
  high:     { color: "#C8901F", bg: "rgba(200,144,31,0.08)", label: "High" },
  medium:   { color: "#1968D3", bg: "rgba(25,104,211,0.08)", label: "Medium" },
  low:      { color: "#6A788D", bg: "rgba(106,120,141,0.08)", label: "Low" },
};

const typeLabels: Record<string, string> = {
  overdue:        "Overdue Payment",
  due_soon:       "Due Soon",
  sent_to_ho:     "Sent to HO",
  to_be_processed: "To Be Processed",
  po_no_invoice:  "Missing Invoice",
};

export default function AlertsPage() {
  const { clientAlerts, alertStates, acknowledgeAlert, resolveAlert, addClientActivity } = useClientData();
  const { openForm } = useGlobalForms();
  const [tab, setTab] = useState("open");
  const [resolveTarget, setResolveTarget] = useState<ClientAlert | null>(null);

  function getState(alert: ClientAlert): "open" | "acknowledged" | "resolved" {
    return alertStates[alert.id] ?? "open";
  }

  const openAlerts     = clientAlerts.filter((a) => getState(a) === "open");
  const criticalAlerts = openAlerts.filter((a) => a.priority === "critical");
  const ackAlerts      = clientAlerts.filter((a) => getState(a) === "acknowledged");
  const resolvedAlerts = clientAlerts.filter((a) => getState(a) === "resolved");

  const displayed =
    tab === "open"         ? openAlerts :
    tab === "critical"     ? criticalAlerts :
    tab === "acknowledged" ? ackAlerts :
    resolvedAlerts;

  function handleAcknowledge(alert: ClientAlert) {
    acknowledgeAlert(alert.id);
    addClientActivity({
      action: "acknowledge_alert",
      description: `Acknowledged alert: ${alert.title}`,
      referenceId: alert.id,
      referenceRef: alert.invoiceRef ?? alert.poRef,
      performedBy: "Ali Khan",
    });
    toast.success("Alert acknowledged");
  }

  function handleResolve(alert: ClientAlert) {
    resolveAlert(alert.id);
    addClientActivity({
      action: "resolve_alert",
      description: `Resolved alert: ${alert.title}`,
      referenceId: alert.id,
      referenceRef: alert.invoiceRef ?? alert.poRef,
      performedBy: "Ali Khan",
    });
    toast.success("Alert resolved");
    setResolveTarget(null);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Alerts"
        subtitle="Live alerts generated from Jeddah Stadium procurement invoices and purchase orders."
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Open Alerts"   value={String(openAlerts.length)}     icon={AlertTriangle} variant="danger" />
        <StatCard label="Critical"       value={String(criticalAlerts.length)} subtext="Immediate action required" icon={AlertTriangle} variant="danger" />
        <StatCard label="Acknowledged"   value={String(ackAlerts.length)}      icon={Bell}          variant="warning" />
        <StatCard label="Resolved"       value={String(resolvedAlerts.length)} icon={CheckCircle}   variant="success" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open ({openAlerts.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({criticalAlerts.length})</TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged ({ackAlerts.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedAlerts.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E3E8F0]" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <EmptyState icon={CheckCircle} title="All clear!" description="No alerts in this category." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((alert) => {
            const { color, bg } = priorityConfig[alert.priority] ?? priorityConfig.low;
            const state = getState(alert);
            return (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-[#E3E8F0] p-5 flex items-start gap-4"
                style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)", borderLeftWidth: 3, borderLeftColor: color }}
              >
                <div className="flex-none w-10 h-10 rounded-[9px] flex items-center justify-center" style={{ background: bg }}>
                  <AlertTriangle size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: color }}>
                          {priorityConfig[alert.priority]?.label ?? alert.priority}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0F3F8] text-[#6A788D]">
                          {typeLabels[alert.type] ?? alert.type}
                        </span>
                        {state === "acknowledged" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#FFFBEB", color: "#C8901F" }}>Acknowledged</span>
                        )}
                        {state === "resolved" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#ECFDF5", color: "#1E8E55" }}>Resolved</span>
                        )}
                      </div>

                      {/* Title + description */}
                      <div className="text-[13.5px] font-semibold text-[#14223B] leading-snug">{alert.title}</div>
                      <div className="text-[12.5px] text-[#6A788D] mt-1 leading-relaxed">{alert.description}</div>

                      {/* Meta row */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {alert.vendorName && (
                          <span className="text-[11.5px] text-[#9AA6B6] flex items-center gap-1">
                            <span className="font-medium text-[#6A788D]">Vendor:</span> {alert.vendorName}
                          </span>
                        )}
                        {alert.poRef && (
                          <span className="text-[11.5px] font-mono text-[#9AA6B6] flex items-center gap-1">
                            <span className="font-medium font-sans text-[#6A788D]">PO:</span> {alert.poRef}
                          </span>
                        )}
                        {alert.invoiceRef && (
                          <span className="text-[11.5px] font-mono text-[#9AA6B6] flex items-center gap-1">
                            <span className="font-medium font-sans text-[#6A788D]">Inv:</span> {alert.invoiceRef}
                          </span>
                        )}
                        {alert.amount !== undefined && (
                          <span className="text-[11.5px] text-[#9AA6B6] flex items-center gap-1">
                            <span className="font-medium text-[#6A788D]">Amount:</span>
                            <span className="font-semibold text-[#14223B]">{formatSAR(alert.amount)}</span>
                          </span>
                        )}
                        {alert.daysOverdue !== undefined && alert.daysOverdue > 0 && (
                          <span className="text-[11.5px] font-semibold" style={{ color }}>
                            {alert.daysOverdue} days overdue
                          </span>
                        )}
                        {alert.daysRemaining !== undefined && alert.daysRemaining >= 0 && (
                          <span className="text-[11.5px] font-semibold" style={{ color }}>
                            {alert.daysRemaining === 0 ? "Due today" : `${alert.daysRemaining} days remaining`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-none mt-0.5">
                      {state === "open" && (
                        <>
                          {alert.relatedInvoiceId && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-[11.5px] h-7 px-2.5"
                              onClick={() => openForm("recordPayment")}>
                              <DollarSign size={11} />Pay
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="gap-1.5 text-[11.5px] h-7 px-2.5"
                            onClick={() => handleAcknowledge(alert)}>
                            <Bell size={11} />Ack
                          </Button>
                          <Button size="sm" variant="outline"
                            className="gap-1.5 text-[11.5px] h-7 px-2.5 text-[#1E8E55] border-[#1E8E55] hover:bg-green-50"
                            onClick={() => setResolveTarget(alert)}>
                            <CheckCircle size={11} />Resolve
                          </Button>
                        </>
                      )}
                      {state === "acknowledged" && (
                        <Button size="sm" variant="outline"
                          className="gap-1.5 text-[11.5px] h-7 px-2.5 text-[#1E8E55] border-[#1E8E55] hover:bg-green-50"
                          onClick={() => setResolveTarget(alert)}>
                          <CheckCircle size={11} />Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve confirmation */}
      <Dialog open={!!resolveTarget} onOpenChange={() => setResolveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Resolve Alert</DialogTitle></DialogHeader>
          <p className="text-[13px] text-[#6A788D] mt-2">
            Mark this alert as resolved? The alert will move to the Resolved tab.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setResolveTarget(null)}>Cancel</Button>
            <Button className="flex-1 text-white" style={{ background: "#1E8E55" }}
              onClick={() => resolveTarget && handleResolve(resolveTarget)}>
              <CheckCircle size={14} className="mr-1.5" />Mark Resolved
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
