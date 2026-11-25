"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LeaveType } from "@/generated/prisma/client";
import { Modal } from "@/components/ui/Modal";
import { countWeekdaysInclusive, getJakartaDateString } from "@/lib/date";
import { submitLeaveAction } from "@/actions/leave.actions";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveQuota: number;
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  leaveQuota,
}: LeaveRequestModalProps) {
  const router = useRouter();
  const todayStr = getJakartaDateString();

  const [leaveType, setLeaveType] = useState<LeaveType>("ANNUAL");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hitung jumlah hari kerja (Senin-Jumat) secara live
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countWeekdaysInclusive(startDate, endDate);
  }, [startDate, endDate]);

  const isQuotaExceeded =
    leaveType === "ANNUAL" && calculatedDays > leaveQuota;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (calculatedDays <= 0) {
      setErrorMsg(
        "Rentang tanggal tidak valid atau tidak memuat hari kerja (Senin–Jumat)."
      );
      return;
    }

    if (isQuotaExceeded) {
      setErrorMsg(
        `Sisa kuota cuti tahunan Anda tidak mencukupi (sisa ${leaveQuota} hari, diajukan ${calculatedDays} hari kerja).`
      );
      return;
    }

    if (reason.trim().length < 5) {
      setErrorMsg("Alasan pengajuan cuti minimal 5 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await submitLeaveAction({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pengajuan Cuti & Izin"
      description="Ajukan permohonan cuti tahunan, sakit, atau izin khusus karyawan"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-start gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tipe Cuti */}
        <div>
          <label className="block text-xs font-medium text-[#4E5058] mb-1.5">
            Jenis cuti / izin
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { type: "ANNUAL", label: "Cuti Tahunan", desc: `Sisa ${leaveQuota} hari` },
              { type: "SICK", label: "Sakit", desc: "Perlu surat dokter" },
              { type: "SPECIAL", label: "Izin Khusus", desc: "Potong gaji / unp." },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setLeaveType(item.type as LeaveType)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  leaveType === item.type
                    ? "bg-[#2B2D31] text-white border-[#2B2D31] shadow-2xs"
                    : "bg-white text-[#2B2D31] border-[#D9DADC] hover:bg-zinc-50"
                }`}
              >
                <p className="text-xs font-semibold">{item.label}</p>
                <p
                  className={`text-[10px] ${
                    leaveType === item.type ? "text-[#FFC93C]" : "text-[#71757E]"
                  }`}
                >
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Rentang Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="startDate"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Tanggal Mulai
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full p-2.5 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] font-mono tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Tanggal Selesai
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full p-2.5 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] font-mono tabular-nums"
            />
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isQuotaExceeded
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-zinc-50 border-[#D9DADC]/80 text-[#2B2D31]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#71757E]" />
            <span>Hari Kerja yang Terhitung:</span>
          </div>
          <div className="font-mono font-bold text-sm tabular-nums">
            {calculatedDays} Hari Kerja
          </div>
        </div>

        {/* Alasan Cuti */}
        <div>
          <label
            htmlFor="reason"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
          >
            Alasan Permohonan Cuti
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan keperluan cuti secara jelas (minimal 5 karakter)..."
            required
            className="w-full p-3 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-[#D9DADC]/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#71757E] hover:text-[#2B2D31] hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <motion.button
            type="submit"
            disabled={isPending || isQuotaExceeded}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2B2D31]" />
                <span>Mengirim...</span>
              </>
            ) : (
              <span>Kirim Permohonan Cuti</span>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
