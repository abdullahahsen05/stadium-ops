"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { demoOpenAlerts, demoOpenInvoices } from "@/lib/demo-shell";
import {
  LayoutDashboard, Package, FileText, Truck, Receipt,
  CreditCard, Building2, Trash2, AlertTriangle, Activity,
  BarChart3, Settings,
} from "lucide-react";

const navSections = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inventory", label: "Inventory", icon: Package },
      { href: "/purchase-orders", label: "Purchase Orders", icon: FileText },
      { href: "/deliveries", label: "Deliveries", icon: Truck },
      { href: "/invoices", label: "Invoices", icon: Receipt, badge: "invoices" },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/vendors", label: "Vendors", icon: Building2 },
      { href: "/debris", label: "Debris / Waste", icon: Trash2 },
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/alerts", label: "Alerts", icon: AlertTriangle, badge: "alerts" },
      { href: "/activity", label: "Activity Log", icon: Activity },
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const getBadge = (key?: string) => {
    if (key === "invoices") return demoOpenInvoices;
    if (key === "alerts") return demoOpenAlerts;
    return 0;
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="flex flex-none w-[244px] flex-col overflow-y-auto" style={{ background: "#15294C" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex-none flex items-center justify-center w-9 h-9 rounded-[9px]"
          style={{ background: "var(--so-accent)" }}
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6">
            <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" />
            <path d="M2 5l6 3 6-3M8 8v6" />
          </svg>
        </div>
        <div>
          <div className="text-[14.5px] font-bold text-white leading-none tracking-tight">StadiumOps</div>
          <div className="text-[9.5px] text-white/50 tracking-[0.13em] uppercase mt-0.5" style={{ fontFamily: "var(--font-geist-mono)" }}>
            COMMAND CENTER
          </div>
        </div>
      </div>

      {/* Nav sections */}
      {navSections.map((section) => (
        <div key={section.label} className="mb-1">
          <div className="text-[10px] font-semibold tracking-[0.13em] uppercase text-white/35 px-[22px] py-2">
            {section.label}
          </div>
          <nav className="flex flex-col gap-0.5 px-3">
            {section.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              const badgeCount = getBadge(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-[11px] px-[11px] py-[9px] rounded-[8px] text-[13px] transition-colors duration-100 no-underline",
                    active
                      ? "font-semibold text-white border-l-[3px] border-l-[--so-accent] pl-[9px]"
                      : "font-medium text-white/60 hover:text-white/90 hover:bg-white/6"
                  )}
                  style={active ? { background: "rgba(224,123,0,0.18)" } : undefined}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.5} className="flex-none" />
                  <span className="flex-1">{label}</span>
                  {badgeCount > 0 && (
                    <span
                      className="text-[10.5px] font-bold text-white rounded-full px-[7px] py-[1px]"
                      style={{
                        background: badge === "invoices" ? "#C0453F" : "#C8901F",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Demo mode badge */}
      <div className="mt-auto px-4 pb-5 pt-4">
        <div className="rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="so-pulse w-[7px] h-[7px] rounded-full flex-none" style={{ background: "var(--so-accent)" }} />
            <span className="text-[11px] font-bold text-white tracking-[0.03em]">Demo Mode</span>
          </div>
          <p className="text-[11px] leading-[1.45] text-white/55">
            Demo pages are optimized for fast walkthroughs.
          </p>
        </div>
      </div>
    </aside>
  );
}
