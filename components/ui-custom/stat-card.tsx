"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "warning" | "danger" | "success" | "info";
  className?: string;
}

const variantStyles = {
  default: { accent: "#E07B00", bg: "rgba(224,123,0,0.08)" },
  warning: { accent: "#C8901F", bg: "rgba(200,144,31,0.08)" },
  danger: { accent: "#C0453F", bg: "rgba(192,69,63,0.08)" },
  success: { accent: "#1E8E55", bg: "rgba(30,142,85,0.08)" },
  info: { accent: "#1968D3", bg: "rgba(25,104,211,0.08)" },
};

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const { accent, bg } = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E3E8F0] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 group",
        className
      )}
      style={{ boxShadow: "0 1px 2px rgba(20,34,59,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-semibold text-[#6A788D] tracking-[0.02em] uppercase">{label}</div>
        {Icon && (
          <div className="flex-none w-9 h-9 rounded-[9px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105" style={{ background: bg }}>
            <Icon size={17} strokeWidth={1.8} style={{ color: accent }} />
          </div>
        )}
      </div>
      <div>
        <div className="text-[28px] font-bold text-[#14223B] leading-none tracking-tight">{value}</div>
        {subtext && (
          <div className="text-[12px] text-[#6A788D] mt-1.5">{subtext}</div>
        )}
      </div>
      {trend && trendValue && (
        <div className={cn("text-[12px] font-medium", trend === "up" ? "text-[#1E8E55]" : trend === "down" ? "text-[#C0453F]" : "text-[#6A788D]")}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </div>
      )}
    </div>
  );
}
