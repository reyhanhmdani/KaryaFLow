"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { LeaveRequestDTO } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewLeaveAction } from "@/actions/leave.actions";
import { formatIndonesianDate } from "@/lib/format";

interface LeaveApprovalTableProps {
  leaveRequests: LeaveRequestDTO[];
  isHrAdmin?: boolean;
  canMonitorAll?: boolean;
  currentEmployeeId?: string | null;
}

type FilterTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function LeaveApprovalTable({
  leaveRequests,
  isHrAdmin = false,
  canMonitorAll = false,
  currentEmployeeId = null,
}: LeaveApprovalTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<LeaveRequestDTO | null>(
    null
  );
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter requests
  const filteredRequests = leaveRequests.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.status === activeTab;
  });

  // Handle Approve
  const handleApprove = (requestId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await reviewLeaveAction({
        requestId,
        decision: "APPROVED",
      });

      if (!res.success) {
        setActionError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  // Handle Reject Submit
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (rejectionNote.trim().length < 3) {
      setActionError("Alasan penolakan wajib diisi minimal 3 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await reviewLeaveAction({
        requestId: rejectingItem.id,
        decision: "REJECTED",
        rejectionNote: rejectionNote.trim(),
      });

      if (!res.success) {
        setActionError(res.error);
      } else {
        setRejectingItem(null);
        setRejectionNote("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs dengan Linear-Style Sliding Layout Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center p-1 bg-[#EDEAE1] rounded-xl border border-[#E2DED3] w-full sm:w-auto">
          {(
            [
              { id: "ALL", label: "Semua Permohonan" },
              { id: "PENDING", label: "Menunggu Approval" },
              { id: "APPROVED", label: "Disetujui" },
              { id: "REJECTED", label: "Ditolak" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="leaveFilterTab"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-[#D9DADC]/80"
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  activeTab === tab.id
                    ? "text-[#2B2D31]"
                    : "text-[#71757E] hover:text-[#2B2D31]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#71757E] tabular-nums">
          Menampilkan {filteredRequests.length} dari {leaveRequests.length} pengajuan
        </span>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Table Data */}
      {filteredRequests.length === 0 ? (
        <div className="p-8 bg-white border border-[#D9DADC] rounded-2xl">
          <EmptyState
            title="Tidak Ada Pengajuan Cuti pada Filter Ini"
            description="Permohonan cuti yang masuk atau riwayat pengajuan akan tampil di sini."
          />
        </div>
      ) : (
        <div className="bg-white border border-[#D9DADC] rounded-2xl shadow-xs overflow-hidden">
          <div
            className="overflow-x-auto focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Tabel Pengajuan Cuti Karyawan"
          >
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4F4F5] border-b border-[#D9DADC] text-[#71757E] font-semibold text-[11px] uppercase tracking-wider">
                  {(canMonitorAll || isHrAdmin) && <th className="py-3 px-5">Karyawan</th>}
                  <th className="py-3 px-5">Tipe Cuti</th>
                  <th className="py-3 px-4">Rentang Tanggal</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-5">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DADC]/50">
                {filteredRequests.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50/80 transition-colors h-[52px]"
                  >
                    {(canMonitorAll || isHrAdmin) && (
                      <td className="py-3 px-5">
                        <p className="font-semibold text-[#1B1C1E]">
                          {row.employeeName || "—"}
                        </p>
                        <p className="text-[11px] text-[#73757D]">
                          {row.employeeCode ? `${row.employeeCode} · ` : ""}
                          {row.department || "—"}
                        </p>
                      </td>
                    )}
                    <td className="py-3 px-5 font-semibold text-[#2B2D31]">
                      {row.leaveType === "ANNUAL"
                        ? "Cuti Tahunan"
                        : row.leaveType === "SICK"
                        ? "Sakit"
                        : "Izin Khusus"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] tabular-nums text-[#2B2D31]">
                      {row.startDate} s/d {row.endDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-100 text-[#2B2D31] tabular-nums">
                        {row.totalDays} Hari
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[#4F535A] max-w-xs truncate">
                      &ldquo;{row.reason}&rdquo;
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-3 px-5 text-right">
                      {isHrAdmin &&
                      row.status === "PENDING" &&
                      row.employeeId !== currentEmployeeId ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(row.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingItem(row);
                              setRejectionNote("");
                              setActionError(null);
                            }}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : row.status === "REJECTED" && row.rejectionNote ? (
                        <span
                          className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                          title={row.rejectionNote}
                        >
                          Ditolak: &ldquo;{row.rejectionNote}&rdquo;
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#71757E] font-mono tabular-nums">
                          {formatIndonesianDate(row.createdAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Penolakan Cuti Wajib Isi Catatan */}
      {rejectingItem && (
        <Modal
          isOpen={!!rejectingItem}
          onClose={() => setRejectingItem(null)}
          title="Tolak Permohonan Cuti"
          description={`Pengajuan dari ${rejectingItem.employeeName || "Karyawan"} (${rejectingItem.totalDays} hari)`}
          maxWidth="sm"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="rejectionNote"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
              >
                Alasan Penolakan (Wajib Diisi)
              </label>
              <textarea
                id="rejectionNote"
                rows={3}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Tuliskan alasan mengapa cuti tidak dapat disetujui (minimal 3 karakter)..."
                required
                className="w-full p-3 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>

            <div className="pt-3 border-t border-[#D9DADC]/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#71757E] hover:text-[#2B2D31] rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Memproses..." : "Konfirmasi Tolak"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
