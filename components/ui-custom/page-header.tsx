import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-6", className)}>
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-[26px] font-bold tracking-tight text-[#14223B] leading-none">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[14px] text-[#6A788D]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-none">{actions}</div>}
    </div>
  );
}
