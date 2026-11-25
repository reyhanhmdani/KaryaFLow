"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PrintActionBarProps {
  slipRef: string;
  status: string;
}

export function PrintActionBar({ slipRef, status }: PrintActionBarProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="print:hidden sticky top-0 z-50 bg-[#2B2D31] text-white py-3 px-4 shadow-md border-b border-zinc-700">
      <div className="max-w-[210mm] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Payroll</span>
          </Link>
          <div className="h-4 w-px bg-zinc-600 hidden sm:block" />
          <span className="text-xs font-mono font-bold text-[#FFC93C] hidden sm:inline">
            {slipRef}
          </span>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 hidden md:inline flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Gunakan Destination: &quot;Save as PDF&quot; (A4 Portrait)</span>
          </span>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
