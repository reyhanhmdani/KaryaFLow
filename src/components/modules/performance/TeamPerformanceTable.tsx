"use client";

import React, { useState } from "react";
import { Edit3 } from "lucide-react";
import { motion } from "motion/react";
import { PerformanceDTO } from "@/types";
import { PerformanceReviewModal } from "./PerformanceReviewModal";

interface TeamPerformanceTableProps {
  scorecards: PerformanceDTO[];
  periodMonth: number;
  periodYear: number;
  canEdit?: boolean;
}

export function TeamPerformanceTable({
  scorecards,
  periodMonth,
  periodYear,
  canEdit = true,
}: TeamPerformanceTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<{
    employeeId: string;
    employeeName: string;
    position?: string;
    initialScore?: number;
    initialNotes?: string;
  } | null>(null);

  const getTier = (score: number) => {
    if (score >= 90) return { label: "Sangat Baik", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 75) return { label: "Baik", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 60) return { label: "Cukup", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Kurang", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  return (
    <>
      <div className="bg-white border border-[#D9DADC] rounded-2xl overflow-hidden shadow-xs">
        <div
          className="overflow-x-auto focus:outline-none"
          tabIndex={0}
          role="region"
          aria-label="Tabel Matriks Performa Tim"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#D9DADC] text-[#71757E] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4 text-center">Kehadiran</th>
                <th className="py-3 px-4 text-center">Ketepatan Waktu</th>
                <th className="py-3 px-4 text-center">Task Completion</th>
                <th className="py-3 px-4 text-center">Skor Akhir</th>
                <th className="py-3 px-4">Catatan Manajer</th>
                {canEdit && <th className="py-3 px-4 text-right">Aksi Evaluasi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DADC]/60">
              {scorecards.map((row) => {
                const attendance = Number(row.attendanceRate || 0);
                const punctuality = Number(row.punctualityRate || 0);
                const task = Number(row.taskCompletionRate || 0);
                const composite = Number(
                  (attendance * 0.3 + punctuality * 0.3 + task * 0.4).toFixed(1)
                );
                const tier = getTier(composite);

                return (
                  <tr
                    key={row.employeeId}
                    className="h-[52px] hover:bg-[#FAFAFA]/80 transition-colors"
                  >
                    {/* Karyawan */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1B1C1E]">
                        {row.employeeName || "Karyawan"}
                      </div>
                      <div className="text-[11px] text-[#73757D]">
                        {row.employeeCode ? `${row.employeeCode} · ` : ""}
                        {row.position || row.department || "Staff"}
                      </div>
                    </td>

                    {/* Kehadiran */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold tabular-nums text-[#2B2D31]">
                        {attendance}%
                      </span>
                    </td>

                    {/* Ketepatan Waktu */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold tabular-nums text-emerald-700">
                        {punctuality}%
                      </span>
                    </td>

                    {/* Task Completion */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold tabular-nums text-blue-700">
                        {task}%
                      </span>
                    </td>

                    {/* Skor Akhir */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-[#2B2D31] tabular-nums">
                          {composite}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tier.color}`}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </td>

                    {/* Catatan */}
                    <td className="py-3 px-4 max-w-[200px] truncate text-[11px] text-[#71757E]">
                      {row.managerNotes ? (
                        <span className="italic">&ldquo;{row.managerNotes}&rdquo;</span>
                      ) : (
                        <span className="text-zinc-400">Belum ada evaluasi</span>
                      )}
                    </td>

                    {/* Aksi */}
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <motion.button
                          type="button"
                          onClick={() =>
                            setSelectedEmployee({
                              employeeId: row.employeeId,
                              employeeName: row.employeeName || "Karyawan",
                              position: row.position,
                              initialScore: task,
                              initialNotes: row.managerNotes || "",
                            })
                          }
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.96 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B1C1E] hover:bg-[#2C2D30] text-[#F7C331] text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Beri Evaluasi</span>
                        </motion.button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Evaluasi */}
      {canEdit && selectedEmployee && (
        <PerformanceReviewModal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          targetEmployee={selectedEmployee}
          periodMonth={periodMonth}
          periodYear={periodYear}
          initialScore={selectedEmployee.initialScore}
          initialNotes={selectedEmployee.initialNotes}
        />
      )}
    </>
  );
}
