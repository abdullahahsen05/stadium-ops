export function formatSAR(amount: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function isDueSoon(dueDate: string, days = 14): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function getPaymentStatusColor(status: string): string {
  if (status === "Paid 100%") return "#1E8E55";
  if (status === "Invoice sent to HO") return "#1968D3";
  if (status === "To be Processed") return "#C8901F";
  return "#6A788D";
}

export function getPaymentStatusBg(status: string): string {
  if (status === "Paid 100%") return "#ECFDF5";
  if (status === "Invoice sent to HO") return "#EFF6FF";
  if (status === "To be Processed") return "#FFFBEB";
  return "#F8F9FC";
}
