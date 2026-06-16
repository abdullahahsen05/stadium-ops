"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import type { Alert } from "@/lib/types";

const priorityConfig = {
  Critical: { color: "#C0453F", bg: "rgba(192,69,63,0.08)" },
  High: { color: "#C8901F", bg: "rgba(200,144,31,0.08)" },
  Medium: { color: "#1968D3", bg: "rgba(25,104,211,0.08)" },
  Low: { color: "#6A788D", bg: "rgba(106,120,141,0.08)" },
};

export default function AlertsPage() {
  const { state, updateAlert, addActivity } = useApp();
  const [tab, setTab] = useState("open");
  const [resolveId, setResolveId] = useState<string | null>(null);

  const filtered = state.alerts.filter((a) => {
    if (tab === "open") return a.status === "Open";
    if (tab === "acknowledged") return a.status === "Acknowledged";
    if (tab === "resolved") return a.status === "Resolved";
    if (tab === "critical") return a.status === "Open" && a.priority === "Critical";
    return true;
  }).sort((a, b) => {
    const p = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
  });

  function acknowledge(alert: Alert) {
    updateAlert(alert.id, {
      status: "Acknowledged",
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: "Ali Khan",
    });
    addActivity({ module: "Alert", action: "acknowledged", description: `Acknowledged alert: ${alert.title}`, referenceId: alert.id, referenceNumber: alert.id, performedBy: "Ali Khan", role: "Project Manager" });
    toast.success("Alert acknowledged");
  }

  function resolve(alert: Alert) {
    updateAlert(alert.id, {
      status: "Resolved",
      resolvedAt: new Date().toISOString(),
    });
    addActivity({ module: "Alert", action: "resolved", description: `Resolved alert: ${alert.title}`, referenceId: alert.id, referenceNumber: alert.id, performedBy: "Ali Khan", role: "Project Manager" });
    toast.success("Alert resolved");
    setResolveId(null);
  }

  const openCount = state.alerts.filter((a) => a.status === "Open").length;
  const criticalCount = state.alerts.filter((a) => a.status === "Open" && a.priority === "Critical").length;
  const ackCount = state.alerts.filter((a) => a.status === "Acknowledged").length;
  const resolvedCount = state.alerts.filter((a) => a.status === "Resolved").length;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Alerts"
        subtitle="Monitor critical issues, low stock warnings, overdue invoices, and delivery delays."
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Open Alerts" value={String(openCount)} icon={AlertTriangle} variant="danger" />
        <StatCard label="Critical" value={String(criticalCount)} subtext="Immediate action required" icon={AlertTriangle} variant="danger" />
        <StatCard label="Acknowledged" value={String(ackCount)} icon={Bell} variant="warning" />
        <StatCard label="Resolved" value={String(resolvedCount)} icon={CheckCircle} variant="success" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open ({openCount})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({criticalCount})</TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged ({ackCount})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E3E8F0] overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}>
          <EmptyState icon={CheckCircle} title="All clear!" description="No alerts in this category." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((alert) => {
            const { color, bg } = priorityConfig[alert.priority] ?? priorityConfig.Low;
            return (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-[#E3E8F0] p-5 flex items-start gap-4"
                style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}
              >
                <div className="flex-none w-10 h-10 rounded-[9px] flex items-center justify-center" style={{ background: bg }}>
                  <AlertTriangle size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={alert.priority} />
                        <StatusBadge status={alert.status} />
                        <span className="text-[11.5px] text-[#6A788D] font-medium">{alert.relatedModule}</span>
                      </div>
                      <div className="text-[13.5px] font-semibold text-[#14223B] leading-snug">{alert.title}</div>
                      <div className="text-[12.5px] text-[#6A788D] mt-1">{alert.description}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      {alert.status === "Open" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => acknowledge(alert)} className="gap-1.5">
                            <Bell size={12} />Acknowledge
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setResolveId(alert.id)} className="gap-1.5 text-[#1E8E55] border-[#1E8E55] hover:bg-green-50">
                            <CheckCircle size={12} />Resolve
                          </Button>
                        </>
                      )}
                      {alert.status === "Acknowledged" && (
                        <Button size="sm" variant="outline" onClick={() => setResolveId(alert.id)} className="gap-1.5 text-[#1E8E55] border-[#1E8E55] hover:bg-green-50">
                          <CheckCircle size={12} />Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11.5px] text-[#9AA6B6]">
                    <span>Created: {format(new Date(alert.createdAt), "MMM d, yyyy h:mm a")}</span>
                    {alert.acknowledgedAt && <span>Acknowledged: {format(new Date(alert.acknowledgedAt), "MMM d, h:mm a")} by {alert.acknowledgedBy}</span>}
                    {alert.resolvedAt && <span>Resolved: {format(new Date(alert.resolvedAt), "MMM d, h:mm a")}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolveId && (
        <Dialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Resolve Alert</DialogTitle></DialogHeader>
            <p className="text-[13px] text-[#6A788D] mt-2">Confirm you want to mark this alert as resolved. This action will close the alert.</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setResolveId(null)}>Cancel</Button>
              <Button className="flex-1 text-white" style={{ background: "#1E8E55" }} onClick={() => {
                const alert = state.alerts.find((a) => a.id === resolveId);
                if (alert) resolve(alert);
              }}>
                <CheckCircle size={14} className="mr-1.5" />Mark Resolved
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
