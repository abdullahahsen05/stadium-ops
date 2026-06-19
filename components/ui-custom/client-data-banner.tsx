"use client";

import { useState, useEffect } from "react";
import { Database, X } from "lucide-react";

const DISMISSED_KEY = "stadiumops_banner_dismissed";

export function ClientDataBanner() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    try {
      const d = localStorage.getItem(DISMISSED_KEY);
      setDismissed(d === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg text-[12px]"
      style={{
        background: "#FFF8F0",
        borderLeft: "3px solid #E07B00",
      }}
    >
      <Database size={13} style={{ color: "#E07B00" }} className="flex-none" />
      <span className="flex-1 text-[#7C4A00]">
        <span className="font-semibold">Client Data Demo:</span> Purchase and invoice records imported from Jeddah Stadium Excel trackers. New actions are saved locally.
      </span>
      <button
        onClick={dismiss}
        className="flex-none text-[#A06020] hover:text-[#7C4A00] transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
