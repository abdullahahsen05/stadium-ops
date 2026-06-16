import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#F5F7FB] flex items-center justify-center mb-4">
          <Icon size={22} strokeWidth={1.5} className="text-[#6A788D]" />
        </div>
      )}
      <div className="text-[15px] font-semibold text-[#14223B] mb-1">{title}</div>
      {description && <div className="text-[13px] text-[#6A788D] max-w-xs">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
