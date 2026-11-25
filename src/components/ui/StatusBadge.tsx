import React from "react";

export type BadgeStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "ON_LEAVE"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT"
  | "PROCESSED"
  | "PAID"
  | "HR_ADMIN"
  | "EXECUTIVE"
  | "EMPLOYEE"
  | "WFO"
  | "WFH"
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; ring: string; dot: string; pulse?: boolean }
> = {
  PRESENT: {
    label: "Hadir",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
    pulse: true,
  },
  APPROVED: {
    label: "Disetujui",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  PAID: {
    label: "Cair",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  LATE: {
    label: "Terlambat",
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
  },
  PENDING: {
    label: "Menunggu",
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
    pulse: true,
  },
  DRAFT: {
    label: "Draft",
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
  },
  ABSENT: {
    label: "Alpa",
    bg: "bg-rose-50",
    text: "text-rose-800",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  REJECTED: {
    label: "Ditolak",
    bg: "bg-rose-50",
    text: "text-rose-800",
    ring: "ring-rose-600/20",
    dot: "bg-rose-500",
  },
  ON_LEAVE: {
    label: "Cuti",
    bg: "bg-blue-50",
    text: "text-blue-800",
    ring: "ring-blue-600/20",
    dot: "bg-blue-500",
  },
  PROCESSED: {
    label: "Diproses",
    bg: "bg-blue-50",
    text: "text-blue-800",
    ring: "ring-blue-600/20",
    dot: "bg-blue-500",
  },
  WFO: {
    label: "WFO",
    bg: "bg-[#EDEAE1]",
    text: "text-[#1B1C1E]",
    ring: "ring-[#E2DED3]",
    dot: "bg-[#4E5058]",
  },
  WFH: {
    label: "WFH",
    bg: "bg-[#EDEAE1]",
    text: "text-[#1B1C1E]",
    ring: "ring-[#E2DED3]",
    dot: "bg-sky-600",
  },
  HR_ADMIN: {
    label: "HR Admin",
    bg: "bg-[#1B1C1E]",
    text: "text-[#F7C331]",
    ring: "ring-[#1B1C1E]",
    dot: "bg-[#F7C331]",
  },
  EXECUTIVE: {
    label: "Executive",
    bg: "bg-[#1B1C1E]",
    text: "text-[#F7C331]",
    ring: "ring-[#1B1C1E]",
    dot: "bg-[#F7C331]",
  },
  EMPLOYEE: {
    label: "Karyawan",
    bg: "bg-[#EDEAE1]",
    text: "text-[#1B1C1E]",
    ring: "ring-[#E2DED3]",
    dot: "bg-[#1B1C1E]",
  },
};

export function StatusBadge({
  status,
  label,
  size = "md",
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-zinc-50",
    text: "text-zinc-700",
    ring: "ring-zinc-200",
    dot: "bg-zinc-400",
  };

  const displayText = label || config.label;
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs";
  const dotSize = size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${config.bg} ${config.text} ${config.ring} ${paddingClass} ${className}`}
    >
      {showDot && (
        <span className="relative flex items-center justify-center shrink-0">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${config.dot}`}
            />
          )}
          <span
            className={`${dotSize} rounded-full ${config.dot} shrink-0`}
            aria-hidden="true"
          />
        </span>
      )}
      <span>{displayText}</span>
    </span>
  );
}

export const Badge = StatusBadge;
