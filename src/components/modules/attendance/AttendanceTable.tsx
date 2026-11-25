import React from "react";
import { AttendanceDTO } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatIndonesianDate, formatTimeWIB } from "@/lib/format";

interface AttendanceTableProps {
  attendances: AttendanceDTO[];
  isHrAdmin?: boolean;
}

export function AttendanceTable({ attendances, isHrAdmin = false }: AttendanceTableProps) {
  if (attendances.length === 0) {
    return (
      <div className="p-8 bg-white border border-[#D9DADC] rounded-2xl">
        <EmptyState
          title="Belum Ada Riwayat Presensi"
          description="Log kehadiran karyawan akan otomatis tersimpan dan terakumulasi di tabel ini."
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D9DADC] rounded-2xl shadow-xs overflow-hidden">
      <div
        className="overflow-x-auto focus:outline-none"
        tabIndex={0}
        role="region"
        aria-label="Tabel Catatan Presensi"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F4F4F5] border-b border-[#D9DADC] text-[#71757E] font-semibold text-[11px] uppercase tracking-wider">
              {isHrAdmin && <th className="py-3 px-5">Karyawan</th>}
              <th className="py-3 px-5">Tanggal</th>
              <th className="py-3 px-4">Jam Masuk</th>
              <th className="py-3 px-4">Jam Keluar</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4 text-right">Jarak</th>
              <th className="py-3 px-5">Catatan</th>
              {isHrAdmin && <th className="py-3 px-5 text-right">Audit GPS</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9DADC]/50">
            {attendances.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors h-[52px]">
                {isHrAdmin && (
                  <td className="py-3 px-5">
                    <p className="font-semibold text-[#1B1C1E]">{row.employeeName || "—"}</p>
                    <p className="text-[11px] text-[#73757D]">
                      {row.employeeCode ? `${row.employeeCode} · ` : ""}
                      {row.department || "—"}
                    </p>
                  </td>
                )}
                <td className="py-3 px-5 font-medium text-[#2B2D31]">
                  {formatIndonesianDate(row.date)}
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-[#2B2D31]">
                  {row.clockIn ? `${formatTimeWIB(row.clockIn)} WIB` : "—"}
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-[#71757E]">
                  {row.clockOut ? `${formatTimeWIB(row.clockOut)} WIB` : "—"}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={row.status} size="sm" />
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={row.isWfo ? "WFO" : "WFH"} size="sm" />
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#71757E]">
                  {row.distanceMeter !== null ? `${row.distanceMeter}m` : "—"}
                </td>
                <td className="py-3 px-5 text-[#71757E] max-w-xs truncate">{row.notes || "—"}</td>
                {isHrAdmin && (
                  <td className="py-3 px-5 text-right font-mono text-[10px] tabular-nums text-[#71757E]">
                    {row.clockInLat !== null && row.clockInLng !== null
                      ? `${row.clockInLat.toFixed(4)}, ${row.clockInLng.toFixed(4)}`
                      : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
