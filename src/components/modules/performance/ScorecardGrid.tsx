"use client";

import React from "react";
import {
  CalendarCheck2,
  Clock4,
  Target,
  Trophy,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";
import { PerformanceDTO } from "@/types";

interface ScorecardGridProps {
  scorecard: PerformanceDTO;
  employeeName?: string;
  position?: string;
}

export function ScorecardGrid({
  scorecard,
}: ScorecardGridProps) {
  const attendance = Number(scorecard.attendanceRate || 0);
  const punctuality = Number(scorecard.punctualityRate || 0);
  const taskCompletion = Number(scorecard.taskCompletionRate || 0);

  // Weighted Score: Attendance 30%, Punctuality 30%, Task Completion 40%
  const compositeScore = Number(
    (attendance * 0.3 + punctuality * 0.3 + taskCompletion * 0.4).toFixed(1)
  );

  const getTier = (score: number) => {
    if (score >= 90) {
      return {
        label: "Sangat Memuaskan (Exceeds Expectations)",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        barColor: "bg-emerald-500",
      };
    }
    if (score >= 75) {
      return {
        label: "Sesuai Ekspektasi (Meets Expectations)",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        barColor: "bg-blue-600",
      };
    }
    if (score >= 60) {
      return {
        label: "Perlu Peningkatan (Needs Improvement)",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        barColor: "bg-amber-500",
      };
    }
    return {
      label: "Di Bawah Target (Unsatisfactory)",
      badge: "bg-rose-50 text-rose-800 border-rose-200",
      barColor: "bg-rose-500",
    };
  };

  const tier = getTier(compositeScore);

  return (
    <div className="space-y-6">
      {/* Kartu Skor Komposit Keseluruhan */}
      <div className="bg-[#2B2D31] text-white rounded-2xl p-6 shadow-xs border border-zinc-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-[#FFC93C]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC93C]">
                Skor Performa Keseluruhan (Overall Score)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight tabular-nums">
              {compositeScore}{" "}
              <span className="text-sm font-semibold text-zinc-400">/ 100</span>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Kombinasi berbobot dari Kehadiran (30%), Ketepatan Waktu (30%), dan Penyelesaian Task (40%).
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tier.badge}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tier.label}</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
              Periode: Bulan {scorecard.periodMonth}/{scorecard.periodYear}
            </span>
          </div>
        </div>
      </div>

      {/* Grid 3 Metrik Terpisah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metrik 1: Attendance Rate */}
        <div className="bg-white border border-[#D9DADC] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-[#71757E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Tingkat Kehadiran
            </span>
            <CalendarCheck2 className="w-4 h-4 text-[#2B2D31]" />
          </div>

          <div>
            <div className="text-3xl font-mono font-bold text-[#2B2D31] tabular-nums">
              {attendance}%
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendance))}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-[#71757E] leading-relaxed">
            Dihitung live dari akumulasi hari hadir, terlambat, dan cuti resmi terhadap total hari kerja efektif.
          </p>
        </div>

        {/* Metrik 2: Punctuality Rate */}
        <div className="bg-white border border-[#D9DADC] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-[#71757E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ketepatan Waktu
            </span>
            <Clock4 className="w-4 h-4 text-[#2B2D31]" />
          </div>

          <div>
            <div className="text-3xl font-mono font-bold text-[#2B2D31] tabular-nums">
              {punctuality}%
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, punctuality))}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-[#71757E] leading-relaxed">
            Persentase presensi masuk sebelum batas toleransi jam kantor (09:00 WIB) pada hari kerja aktif.
          </p>
        </div>

        {/* Metrik 3: Task Completion Rate */}
        <div className="bg-white border border-[#D9DADC] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-[#71757E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Target & OKR Sprint
            </span>
            <Target className="w-4 h-4 text-[#2B2D31]" />
          </div>

          <div>
            <div className="text-3xl font-mono font-bold text-[#2B2D31] tabular-nums">
              {taskCompletion}%
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#FFC93C] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, taskCompletion))}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-[#71757E] leading-relaxed">
            Penilaian kualitatif dan kuantitatif penyelesaian tugas dan delivery proyek dari evaluasi berkala manajer.
          </p>
        </div>
      </div>

      {/* Kartu Feedback Manajer */}
      <div className="bg-white border border-[#D9DADC] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#71757E]">
          <MessageSquareQuote className="w-4 h-4 text-[#2B2D31]" />
          <span>Catatan Kualitatif & Rekomendasi Manajer</span>
        </div>

        {scorecard.managerNotes ? (
          <div className="p-4 rounded-xl bg-zinc-50 border border-[#D9DADC]/80 text-xs text-[#2B2D31] leading-relaxed italic">
            &ldquo;{scorecard.managerNotes}&rdquo;
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 border border-[#D9DADC]/60 text-xs text-[#71757E]">
            Belum ada catatan kualitatif khusus yang diberikan untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
