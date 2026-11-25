"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Award, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { savePerformanceReviewAction } from "@/actions/performance.actions";

interface PerformanceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmployee: {
    employeeId: string;
    employeeName: string;
    position?: string;
  };
  periodMonth: number;
  periodYear: number;
  initialScore?: number;
  initialNotes?: string;
}

export function PerformanceReviewModal({
  isOpen,
  onClose,
  targetEmployee,
  periodMonth,
  periodYear,
  initialScore = 80,
  initialNotes = "",
}: PerformanceReviewModalProps) {
  const router = useRouter();
  const [taskCompletionRate, setTaskCompletionRate] = useState<number>(initialScore);
  const [managerNotes, setManagerNotes] = useState<string>(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await savePerformanceReviewAction({
        employeeId: targetEmployee.employeeId,
        periodMonth,
        periodYear,
        taskCompletionRate: Number(taskCompletionRate),
        managerNotes: managerNotes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Evaluasi performa berhasil disimpan!");
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 800);
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2B2D31]/40 backdrop-blur-xs"
        />

        {/* Modal Dialog with Spring Physics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#D9DADC] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-b from-[#FAFAFA] to-white border-b border-[#D9DADC]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2B2D31] text-[#FFC93C] flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2B2D31]">
                  Evaluasi KPI & Kinerja Karyawan
                </h3>
                <p className="text-xs text-[#73757D]">
                  {targetEmployee.employeeName} ({targetEmployee.position || "Staff"}) · Periode {periodMonth}/{periodYear}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71757E] hover:text-[#2B2D31] hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Slider & Input: Task Completion Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2B2D31] uppercase tracking-wider">
                  Tingkat Penyelesaian Target / OKR (0-100%)
                </label>
                <span className="font-mono font-bold text-base text-[#2B2D31] tabular-nums">
                  {taskCompletionRate}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={taskCompletionRate}
                onChange={(e) => setTaskCompletionRate(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#2B2D31]"
              />

              <div className="flex justify-between text-[10px] text-[#71757E] font-mono">
                <span>0% (Kurang)</span>
                <span>50% (Rata-rata)</span>
                <span>80% (Baik)</span>
                <span>100% (Maksimal)</span>
              </div>
            </div>

            {/* Manager Notes Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B2D31] uppercase tracking-wider">
                Catatan Kualitatif / Feedback Manajer
              </label>
              <textarea
                rows={4}
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Tuliskan evaluasi pencapaian sprint, poin kekuatan, atau area pengembangan karyawan..."
                className="w-full p-3 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B2D31]/10 focus:border-[#2B2D31] transition-all"
              />
              <p className="text-[10px] text-[#71757E]">
                Catatan ini akan langsung tampil di halaman scorecard dashboard karyawan.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D9DADC]/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D9DADC] text-xs font-semibold text-[#2B2D31] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2B2D31] hover:bg-[#1E1F22] text-[#FFC93C] font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Evaluasi KPI</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
