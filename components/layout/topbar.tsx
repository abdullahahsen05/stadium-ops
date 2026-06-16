"use client";

import { useState } from "react";
import { Bell, ChevronDown, Search } from "lucide-react";
import { demoOpenAlerts } from "@/lib/demo-shell";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/types";

const roles: { name: UserRole; desc: string; dot: string }[] = [
  { name: "Project Manager", desc: "Full access — all modules", dot: "#E07B00" },
  { name: "Finance Officer", desc: "Invoices, payments, reports", dot: "#1968D3" },
  { name: "Procurement Officer", desc: "POs, deliveries, vendors", dot: "#1E8E55" },
  { name: "Site Engineer", desc: "Inventory, deliveries, debris", dot: "#8B5CF6" },
  { name: "Viewer", desc: "Read-only access", dot: "#6A788D" },
];

export function TopBar() {
  const [role, setRole] = useState<UserRole>("Project Manager");

  return (
    <header className="flex-none flex items-center gap-4 h-[62px] px-6 bg-white border-b border-[#E3E8F0] z-30">
      {/* Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-[420px] bg-[#F5F7FB] border border-[#E3E8F0] rounded-[9px] px-3.5 py-2.5">
        <Search size={15} strokeWidth={1.6} className="text-[#6A788D] flex-none" />
        <span className="text-[13px] text-[#6A788D]">Search materials, POs, vendors…</span>
        <span
          className="ml-auto text-[10.5px] text-[#9AA6B6] border border-[#E3E8F0] rounded-[5px] px-[5px] py-[1px]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ⌘K
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Project selector */}
        <button className="flex items-center gap-2 text-[12.5px] font-semibold text-[#14223B] bg-[#F5F7FB] border border-[#E3E8F0] rounded-[8px] px-3 py-2">
          <span className="w-[7px] h-[7px] rounded-[2px] flex-none" style={{ background: "var(--so-accent)" }} />
          Stadium Phase 1
          <ChevronDown size={11} strokeWidth={1.6} className="text-[#6A788D]" />
        </button>

        {/* Date range */}
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#3A4760] border border-[#E3E8F0] rounded-[8px] px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6A788D" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
          Jun 1 – Jun 16
        </div>

        {/* Role switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-[12.5px] font-semibold text-[#14223B] bg-white border border-[#E3E8F0] rounded-[8px] px-3 py-[7px] cursor-pointer hover:bg-[#F5F7FB] transition-colors">
            <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "#E07B00" }} />
            {role}
            <ChevronDown size={11} strokeWidth={1.6} className="text-[#6A788D]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-[10px] tracking-[0.1em] uppercase text-[#9AA0AB] font-semibold">
              Demo Role
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((r) => (
              <DropdownMenuItem
                key={r.name}
                onClick={() => setRole(r.name)}
                className="flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: r.dot }} />
                <span className="flex-1">
                  <span className="block text-[13px] font-semibold text-[#1A2230]">{r.name}</span>
                  <span className="block text-[11px] text-[#6B7384]">{r.desc}</span>
                </span>
                {role === r.name && (
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative w-[38px] h-[38px] border border-[#E3E8F0] bg-white rounded-[9px] flex items-center justify-center hover:bg-[#F5F7FB] transition-colors">
          <Bell size={17} strokeWidth={1.5} className="text-[#3A4760]" />
          {demoOpenAlerts > 0 && (
            <span className="absolute top-[8px] right-[9px] w-[7px] h-[7px] rounded-full bg-[#C0453F] border-[1.5px] border-white" />
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-3.5 border-l border-[#E3E8F0]">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[12.5px] font-bold flex-none"
            style={{ background: "var(--so-accent)" }}
          >
            AK
          </div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-semibold text-[#14223B]">Ali Khan</div>
            <div className="text-[11px] text-[#6A788D]">{role}</div>
          </div>
          <ChevronDown size={11} strokeWidth={1.6} className="text-[#6A788D]" />
        </div>
      </div>
    </header>
  );
}
