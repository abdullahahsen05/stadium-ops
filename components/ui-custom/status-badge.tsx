import { cn } from "@/lib/utils";

type StatusVariant =
  | "success" | "warning" | "danger" | "info" | "neutral"
  | "Delivered" | "Partial" | "Pending" | "Scheduled" | "In Transit"
  | "Delayed" | "Rejected" | "Draft" | "Sent" | "Completed" | "Cancelled"
  | "Approved" | "Paid" | "Overdue" | "Active" | "On Hold" | "Blacklisted"
  | "Disposed" | "Removed" | "Open" | "Acknowledged" | "Resolved"
  | "Critical" | "High" | "Medium" | "Low"
  | "Good" | "Damaged";

const styles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-50 text-slate-600 border-slate-200",

  // PO / Delivery statuses
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Partial: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-slate-50 text-slate-600 border-slate-200",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  "In Transit": "bg-blue-50 text-blue-700 border-blue-200",
  Delayed: "bg-red-50 text-red-700 border-red-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Draft: "bg-slate-50 text-slate-600 border-slate-200",
  Sent: "bg-blue-50 text-blue-700 border-blue-200",
  Cancelled: "bg-slate-50 text-slate-400 border-slate-200 line-through",

  // Invoice / Payment
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",

  // Vendor
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
  Blacklisted: "bg-red-50 text-red-700 border-red-200",

  // Debris
  Disposed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Removed: "bg-blue-50 text-blue-700 border-blue-200",

  // Alerts
  Open: "bg-red-50 text-red-700 border-red-200",
  Acknowledged: "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // Priority
  Critical: "bg-red-100 text-red-800 border-red-300 font-bold",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",

  // Condition
  Good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Damaged: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = styles[status] ?? styles.neutral;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold border",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
