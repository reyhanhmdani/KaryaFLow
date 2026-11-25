"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

interface PerformancePeriodSelectorProps {
  currentMonth: number;
  currentYear: number;
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

export function PerformancePeriodSelector({
  currentMonth,
  currentYear,
}: PerformancePeriodSelectorProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    router.push(`/performa?month=${month}&year=${year}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2B2D31]">
        <Calendar className="w-4 h-4 text-[#71757E]" />
        <span className="hidden sm:inline">Periode Evaluasi:</span>
      </div>

      <select
        value={selectedMonth}
        onChange={(e) =>
          handlePeriodChange(Number(e.target.value), selectedYear)
        }
        className="px-3 py-1.5 text-xs font-medium text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B2D31]/10 cursor-pointer"
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
        className="px-3 py-1.5 text-xs font-mono font-medium text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B2D31]/10 cursor-pointer"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
