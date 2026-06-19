"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, Search, Plus, FileText, Receipt, DollarSign, Building2, Upload, X } from "lucide-react";
import { demoOpenAlerts } from "@/lib/demo-shell";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useClientData } from "@/lib/client-data/client-context";
import { useGlobalForms } from "@/lib/global-forms-context";
import { formatSAR } from "@/lib/client-data/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const pendingActionRef = useRef<string | null>(null);
  const { clientPOs, clientInvoices } = useClientData();
  const { openForm } = useGlobalForms();
  const router = useRouter();

  function handleDropdownChange(open: boolean) {
    setQuickAddOpen(open);
    if (!open && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action === "navigate:/data-import") {
        router.push("/data-import");
      } else {
        openForm(action as Parameters<typeof openForm>[0]);
      }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
        setCmdQuery("");
      }
      if (e.key === "Escape") setCmdOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = cmdQuery.toLowerCase().trim();

  const matchedPOs = query
    ? clientPOs.filter((po) =>
        po.poRef.toLowerCase().includes(query) ||
        po.description.toLowerCase().includes(query) ||
        po.vendorName.toLowerCase().includes(query)
      ).slice(0, 5)
    : [];

  const matchedInvoices = query
    ? clientInvoices.filter((inv) =>
        inv.invoiceRef.toLowerCase().includes(query) ||
        inv.poRef.toLowerCase().includes(query) ||
        inv.vendorName.toLowerCase().includes(query)
      ).slice(0, 5)
    : [];

  const hasResults = matchedPOs.length > 0 || matchedInvoices.length > 0;

  return (
    <>
      <header className="flex-none flex items-center gap-4 h-[62px] px-6 bg-white border-b border-[#E3E8F0] z-30">
        {/* Search — opens command dialog */}
        <button
          onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
          className="flex items-center gap-2.5 flex-1 max-w-[380px] bg-[#F5F7FB] border border-[#E3E8F0] rounded-[9px] px-3.5 py-2.5 hover:border-[#E07B00]/30 transition-colors text-left"
        >
          <Search size={15} strokeWidth={1.6} className="text-[#6A788D] flex-none" />
          <span className="text-[13px] text-[#6A788D] flex-1">Search POs, invoices, vendors…</span>
          <span className="text-[10.5px] text-[#9AA6B6] border border-[#E3E8F0] rounded-[5px] px-[5px] py-[1px]" style={{ fontFamily: "var(--font-geist-mono)" }}>
            ⌘K
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {/* Quick Add */}
          <DropdownMenu open={quickAddOpen} onOpenChange={handleDropdownChange}>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white rounded-[8px] px-3 py-[7px] hover:opacity-90 transition-opacity outline-none" style={{ background: "#E07B00" }}>
              <Plus size={14} />Quick Add
              <ChevronDown size={11} strokeWidth={1.6} className="opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[10px] tracking-[0.1em] uppercase text-[#9AA0AB] font-semibold">
                Quick Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {([
                { label: "Create Purchase Order", icon: FileText, key: "addPO" },
                { label: "Add Invoice",           icon: Receipt,  key: "addInvoice" },
                { label: "Record Payment",        icon: DollarSign, key: "recordPayment" },
                { label: "Add Vendor",            icon: Building2, key: "addVendor" },
                { label: "Import Excel / CSV",    icon: Upload,   key: "navigate:/data-import" },
              ] as const).map((a) => (
                <DropdownMenuItem
                  key={a.label}
                  className="cursor-pointer"
                  onClick={() => { pendingActionRef.current = a.key; }}
                >
                  <a.icon size={14} className="text-[#E07B00] flex-none" />
                  <span className="text-[13px] text-[#1A2230]">{a.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                  {role === r.name && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
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
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[12.5px] font-bold flex-none" style={{ background: "var(--so-accent)" }}>
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

      {/* Command Search Dialog */}
      <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E3E8F0]">
            <Search size={16} className="text-[#6A788D] flex-none" />
            <input
              autoFocus
              className="flex-1 text-[14px] text-[#14223B] outline-none placeholder:text-[#9AA6B6] bg-transparent"
              placeholder="Search PO refs, invoice refs, vendors…"
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
            />
            {cmdQuery && (
              <button onClick={() => setCmdQuery("")} className="text-[#9AA6B6] hover:text-[#6A788D]">
                <X size={14} />
              </button>
            )}
            <kbd className="text-[10px] text-[#9AA6B6] border border-[#E3E8F0] rounded px-1.5 py-0.5 font-mono">Esc</kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {!query && (
              <div className="p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6] mb-2">Quick Navigation</div>
                <div className="space-y-1">
                  {[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Purchase Orders", href: "/purchase-orders" },
                    { label: "Invoices", href: "/invoices" },
                    { label: "Payments", href: "/payments" },
                    { label: "Vendors", href: "/vendors" },
                    { label: "Reports", href: "/reports" },
                    { label: "Data Import", href: "/data-import" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setCmdOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F5F7FB] text-[13px] font-medium text-[#14223B] transition-colors"
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono text-[#6A788D] bg-[#F0F3F8]">→</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {query && !hasResults && (
              <div className="p-6 text-center text-[13px] text-[#6A788D]">
                No results for &quot;{cmdQuery}&quot;
              </div>
            )}

            {matchedPOs.length > 0 && (
              <div className="p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6] mb-2">Purchase Orders</div>
                <div className="space-y-1">
                  {matchedPOs.map((po) => (
                    <Link
                      key={po.id}
                      href={`/purchase-orders/${po.id}`}
                      onClick={() => setCmdOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#F5F7FB] transition-colors"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-[#14223B] font-mono">{po.poRef}</div>
                        <div className="text-[11.5px] text-[#6A788D]">{po.vendorName} · {po.discipline}</div>
                      </div>
                      <div className="text-[12px] font-semibold text-[#14223B]">{formatSAR(po.amountWithVatSar)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {matchedInvoices.length > 0 && (
              <div className="p-4 border-t border-[#F0F3F8]">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AA6B6] mb-2">Invoices</div>
                <div className="space-y-1">
                  {matchedInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href="/invoices"
                      onClick={() => setCmdOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#F5F7FB] transition-colors"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-[#14223B] font-mono">{inv.invoiceRef}</div>
                        <div className="text-[11.5px] text-[#6A788D]">{inv.vendorName} · {inv.poRef}</div>
                      </div>
                      <div className="text-[12px] font-semibold text-[#14223B]">{formatSAR(inv.invoiceAmountWithVat)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
