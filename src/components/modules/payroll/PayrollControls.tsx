"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generatePayrollAction } from "@/actions/payroll.actions";

interface PayrollControlsProps {
  currentMonth: number;
  currentYear: number;
  role: string;
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const YEARS = [2025, 2026, 2027];

export function PayrollControls({
  currentMonth,
  currentYear,
  role,
}: PayrollControlsProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isHrAdmin = role === "HR_ADMIN";

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    router.push(`/payroll?month=${month}&year=${year}`);
  };

  const handleGeneratePayroll = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await generatePayrollAction({
        periodMonth: selectedMonth,
        periodYear: selectedYear,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        const monthName =
          MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
        setSuccessMsg(
          `Kalkulasi payroll periode ${monthName} ${selectedYear} berhasil diproses untuk ${res.data.length} karyawan.`
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white border border-[#E2DED3] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,28,30,0.03)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Periode Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#1B1C1E]">
            <Calendar className="w-4 h-4 text-[#73757D]" />
            <span>Periode gaji</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) =>
                handlePeriodChange(Number(e.target.value), selectedYear)
              }
              className="px-3 py-1.5 text-xs font-medium text-[#1B1C1E] bg-[#FAF8F4] border border-[#E2DED3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B1C1E]/10 cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) =>
                handlePeriodChange(selectedMonth, Number(e.target.value))
              }
              className="px-3 py-1.5 text-xs font-mono font-medium text-[#1B1C1E] bg-[#FAF8F4] border border-[#E2DED3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B1C1E]/10 cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button: Generate Payroll (HR Admin Only) */}
        {isHrAdmin && (
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleGeneratePayroll}
              disabled={isPending}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B1C1E] hover:bg-[#2C2D30] text-[#F6F4EE] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F7C331]" />
                  <span>Menghitung payroll...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#F7C331]" />
                  <span>Kalkulasi payroll bulanan</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Feedback Alerts */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="flex items-center justify-between gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-600 hover:text-rose-900 text-xs font-bold px-1"
            >
              ×
            </button>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="flex items-center justify-between gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs font-bold px-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
