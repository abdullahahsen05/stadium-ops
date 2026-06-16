"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { formatPKR } from "@/lib/store";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { StatCard } from "@/components/ui-custom/stat-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Star, Package, Truck, Receipt, CreditCard } from "lucide-react";
import Link from "next/link";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();

  const vendor = state.vendors.find((v) => v.id === id);
  if (!vendor) return <div className="p-8 text-[#6A788D]">Vendor not found.</div>;

  const vendorPOs = state.purchaseOrders.filter((po) => po.vendorId === id);
  const vendorDeliveries = state.deliveries.filter((d) => d.vendorId === id);
  const vendorInvoices = state.invoices.filter((inv) => inv.vendorId === id);
  const vendorPayments = state.payments.filter((p) => p.vendorId === id);
  const onTimeRate = vendor.totalDeliveries > 0 ? Math.round((vendor.onTimeDeliveries / vendor.totalDeliveries) * 100) : 100;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft size={15} />Back
        </Button>
        <div className="h-4 w-px bg-[#E3E8F0]" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#14223B] tracking-tight">{vendor.name}</h1>
            <StatusBadge status={vendor.status} />
          </div>
          <p className="text-[13px] text-[#6A788D] mt-0.5">{vendor.code} · {vendor.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        <div className="flex flex-col gap-5">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3.5">
            <StatCard label="Total PO Value" value={`PKR ${(vendor.totalPOValue / 1000000).toFixed(1)}M`} icon={Package} />
            <StatCard label="On-Time Rate" value={`${onTimeRate}%`} icon={Truck} variant={onTimeRate >= 90 ? "success" : onTimeRate >= 75 ? "warning" : "danger"} />
            <StatCard label="Pending Invoices" value={formatPKR(vendor.pendingInvoiceAmount)} icon={Receipt} variant="warning" />
            <StatCard label="Rating" value={vendor.rating > 0 ? `${vendor.rating.toFixed(1)}/5` : "N/A"} icon={Star} variant="info" />
          </div>

          {/* PO History */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5">
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Purchase Order History</div>
            {vendorPOs.length === 0 ? <div className="text-[13px] text-[#6A788D]">No purchase orders.</div> : (
              <table className="w-full text-[12.5px]">
                <thead><tr className="border-b border-[#E3E8F0]">
                  {["PO #", "Zone", "Total", "Created", "Expected Delivery", "Status"].map(h => <th key={h} className="text-left py-2 pr-4 font-semibold text-[#6A788D]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {vendorPOs.map((po) => (
                    <tr key={po.id} className="border-b border-[#F0F3F8]">
                      <td className="py-2.5 pr-4 font-mono-id">
                        <Link href={`/purchase-orders/${po.id}`} className="text-[#E07B00] hover:underline">{po.poNumber}</Link>
                      </td>
                      <td className="py-2.5 pr-4 text-[#6A788D]">{po.zone}</td>
                      <td className="py-2.5 pr-4 font-mono-id font-semibold">{formatPKR(po.totalAmount)}</td>
                      <td className="py-2.5 pr-4 text-[#6A788D]">{po.createdDate}</td>
                      <td className="py-2.5 pr-4 text-[#6A788D]">{po.expectedDeliveryDate}</td>
                      <td className="py-2.5"><StatusBadge status={po.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5">
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Invoice & Payment History</div>
            {vendorInvoices.length === 0 ? <div className="text-[13px] text-[#6A788D]">No invoices.</div> : (
              <table className="w-full text-[12.5px]">
                <thead><tr className="border-b border-[#E3E8F0]">
                  {["Invoice #", "Date", "Due", "Total", "Status"].map(h => <th key={h} className="text-left py-2 pr-4 font-semibold text-[#6A788D]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {vendorInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#F0F3F8]">
                      <td className="py-2.5 pr-4 font-mono-id text-[#14223B]">{inv.invoiceNumber}</td>
                      <td className="py-2.5 pr-4 text-[#6A788D]">{inv.invoiceDate}</td>
                      <td className="py-2.5 pr-4 text-[#6A788D]">{inv.dueDate}</td>
                      <td className="py-2.5 pr-4 font-semibold font-mono-id">{formatPKR(inv.totalAmount)}</td>
                      <td className="py-2.5"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: contact + delivery perf */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5">
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Contact Information</div>
            <div className="flex flex-col gap-3 text-[12.5px]">
              <div className="flex items-center gap-2.5 text-[#6A788D]">
                <Package size={14} className="flex-none" />
                <span>{vendor.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#6A788D]">
                <Mail size={14} className="flex-none" />
                <a href={`mailto:${vendor.email}`} className="hover:text-[#E07B00]">{vendor.email}</a>
              </div>
              <div className="flex items-center gap-2.5 text-[#6A788D]">
                <Phone size={14} className="flex-none" />
                <span>{vendor.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-[#6A788D]">
                <MapPin size={14} className="flex-none mt-0.5" />
                <span>{vendor.address}</span>
              </div>
            </div>
            <div className="border-t border-[#E3E8F0] pt-4 mt-4">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-[#6A788D]">Joined</span>
                <span className="font-semibold text-[#14223B]">{vendor.joinedDate}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#6A788D]">Status</span>
                <StatusBadge status={vendor.status} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E3E8F0] p-5">
            <div className="text-[13px] font-semibold text-[#14223B] mb-4">Delivery Performance</div>
            <div className="mb-3">
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-[#6A788D]">On-Time Rate</span>
                <span className="font-bold" style={{ color: onTimeRate >= 90 ? "#1E8E55" : onTimeRate >= 75 ? "#C8901F" : "#C0453F" }}>{onTimeRate}%</span>
              </div>
              <div className="h-2 bg-[#F0F3F8] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${onTimeRate}%`, background: onTimeRate >= 90 ? "#1E8E55" : onTimeRate >= 75 ? "#C8901F" : "#C0453F" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="text-center p-2 bg-[#F8F9FC] rounded-lg">
                <div className="font-bold text-[18px] text-[#14223B]">{vendor.totalDeliveries}</div>
                <div className="text-[#6A788D]">Total</div>
              </div>
              <div className="text-center p-2 bg-[#F8F9FC] rounded-lg">
                <div className="font-bold text-[18px] text-[#1E8E55]">{vendor.onTimeDeliveries}</div>
                <div className="text-[#6A788D]">On Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
