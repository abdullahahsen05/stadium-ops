import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, actions }: ChartCardProps) {
  return (
    <div
      className={cn("bg-white rounded-xl border border-[#E3E8F0] p-5", className)}
      style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[14px] font-semibold text-[#14223B]">{title}</div>
          {subtitle && <div className="text-[12px] text-[#6A788D] mt-0.5">{subtitle}</div>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
