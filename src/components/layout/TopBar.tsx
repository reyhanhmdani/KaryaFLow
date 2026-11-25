"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface TopBarProps {
  serverDate: string;
}

const pageTitles: Record<string, string> = {
  "/": "Ringkasan Ruang Kerja",
  "/presensi": "Terminal Presensi & Geofence",
  "/cuti": "Pengajuan & Persetujuan Cuti",
  "/payroll": "Slip Gaji & Payroll",
  "/performa": "Performa & Scorecard KPI",
  "/pengaturan": "Pengaturan Kantor & Geofence",
};

export function TopBar({ serverDate }: TopBarProps) {
  const pathname = usePathname();
  const currentTitle = pageTitles[pathname] || "Portal Karyawan";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-[#E2DED3] bg-[#F6F4EE]/85 backdrop-blur-md px-5 sm:px-8 flex items-center justify-between">
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-2.5 pl-12 md:pl-0 min-w-0">
        <span className="text-xs font-medium text-[#73757D] hidden sm:inline">
          KaryaFlow
        </span>
        <span className="text-xs text-[#C8C3B6] hidden sm:inline">/</span>
        <h1 className="font-display text-sm font-semibold text-[#1B1C1E] tracking-tight truncate">
          {currentTitle}
        </h1>
      </div>

      {/* Right: Server-synced WIB Date */}
      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/85 border border-[#E2DED3] text-[11px] text-[#4E5058] font-mono tabular-nums shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
        <span className="hidden sm:inline">{serverDate}</span>
        <span className="text-[#73757D]">WIB</span>
      </div>
    </header>
  );
}

export const TopHeader = TopBar;
