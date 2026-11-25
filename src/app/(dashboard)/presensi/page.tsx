import React from "react";
import { requireUser } from "@/lib/auth";
import {
  getAttendanceSummary,
  getOfficeConfig,
  listAttendances,
} from "@/services/attendance.service";
import { getEffectiveWorkingDays, getJakartaTimeParts } from "@/lib/date";
import { AttendanceTerminal } from "@/components/modules/attendance/AttendanceTerminal";
import { AttendanceTable } from "@/components/modules/attendance/AttendanceTable";
import { MetricRibbon } from "@/components/ui/MetricRibbon";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { AutoRefresh } from "@/components/ui/AutoRefresh";

export default async function PresensiPage() {
  const user = await requireUser();
  const config = await getOfficeConfig();
  const { year, month } = getJakartaTimeParts();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const isHrAdmin = user.role === "HR_ADMIN";
  const isExecutive = user.role === "EXECUTIVE";
  const canMonitorTeam = isHrAdmin || isExecutive;
  const profile = user.employeeProfile;
  const canClockIn = Boolean(profile && profile.status !== "RESIGNED");

  const summary = profile
    ? await getAttendanceSummary(profile.id, year, month)
    : null;

  const attendances = canMonitorTeam
    ? await listAttendances({ monthPrefix })
    : profile
    ? await listAttendances({ employeeId: profile.id, monthPrefix })
    : [];

  const effectiveWorkingDays =
    summary?.effectiveWorkingDays ?? getEffectiveWorkingDays(year, month);
  const presentDays =
    summary?.presentDays ??
    attendances.filter((a) => a.status === "PRESENT").length;
  const lateDays =
    summary?.lateDays ?? attendances.filter((a) => a.status === "LATE").length;
  const onLeaveDays =
    summary?.onLeaveDays ??
    attendances.filter((a) => a.status === "ON_LEAVE").length;

  return (
    <StaggerContainer className="space-y-6">
      {/* Header Presensi */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
          <div className="space-y-1">
            <h2
              className="font-display font-semibold tracking-tight text-[#1B1C1E]"
              style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
            >
              {canClockIn ? "Terminal Presensi" : "Monitoring Presensi Tim"}
            </h2>
            <p className="text-xs sm:text-sm text-[#73757D]">
              {isExecutive
                ? "Pantauan read-only kedisiplinan kehadiran karyawan dan staf HR"
                : isHrAdmin && canClockIn
                ? "Pantau log kehadiran seluruh tim sekaligus catat presensi Anda"
                : isHrAdmin
                ? "Pantau log kehadiran seluruh tim (akun admin non-karyawan)"
                : "Catat masuk dan pulang berbasis validasi radius geofence kantor"}
            </p>
          </div>
          <div className="text-xs font-mono text-[#4E5058] bg-white border border-[#E2DED3] px-3 py-1.5 rounded-full tabular-nums self-start sm:self-auto">
            Periode {monthPrefix}
          </div>
        </div>
      </StaggerItem>

      {/* Summary Metric Ribbon */}
      <StaggerItem>
        <MetricRibbon
          items={[
            {
              label: "Hari kerja efektif",
              value: `${effectiveWorkingDays} hari`,
              helper: `Bulan ${month}/${year}`,
              accent: "neutral",
            },
            {
              label: summary ? "Hadir tepat waktu" : "Log hadir tim",
              value: presentDays,
              helper: "Clock-in sebelum batas masuk",
              accent: "emerald",
            },
            {
              label: summary ? "Terlambat" : "Log terlambat tim",
              value: lateDays,
              helper: "Tercatat lewat jam masuk",
              accent: "amber",
            },
            {
              label: summary ? "Cuti & izin" : "Log cuti tim",
              value: onLeaveDays,
              helper: "Disetujui HR",
              accent: "blue",
            },
          ]}
        />
      </StaggerItem>

      {/* Terminal Presensi Mandiri (Hanya untuk akun dengan EmployeeProfile aktif) */}
      {canClockIn && summary && (
        <StaggerItem>
          <AttendanceTerminal
            config={config}
            todayAttendance={summary.todayRecord}
            user={user}
          />
        </StaggerItem>
      )}

      {/* Riwayat / Log Presensi Table */}
      <StaggerItem className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-base font-semibold text-[#1B1C1E]">
              {canMonitorTeam
                ? "Log presensi seluruh tim"
                : "Riwayat presensi pribadi"}
            </h3>
            {canMonitorTeam && (
              <AutoRefresh intervalMs={20000} showIndicator={true} />
            )}
          </div>
          <span className="text-xs text-[#73757D] font-mono tabular-nums">
            {attendances.length} catatan
          </span>
        </div>
        <AttendanceTable attendances={attendances} isHrAdmin={canMonitorTeam} />
      </StaggerItem>
    </StaggerContainer>
  );
}
