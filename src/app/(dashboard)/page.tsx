import React from "react";
import Link from "next/link";
import {
  Clock,
  CalendarDays,
  Receipt,
  TrendingUp,
  Users,
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmploymentStatus, LeaveStatus } from "@/generated/prisma/client";
import { getAttendanceSummary, listAttendances } from "@/services/attendance.service";
import { listLeaveRequests } from "@/services/leave.service";
import { listPayrolls } from "@/services/payroll.service";
import { computeObjectiveRates } from "@/services/performance.service";
import { getExecutiveOverview } from "@/services/executive.service";
import { getJakartaDateString, getJakartaTimeParts } from "@/lib/date";
import { formatIDR, formatTimeWIB } from "@/lib/format";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { MetricRibbon } from "@/components/ui/MetricRibbon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

export default async function DashboardPage() {
  const user = await requireUser();
  const todayStr = getJakartaDateString();
  const { year, month } = getJakartaTimeParts();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  // 1. EXECUTIVE (Read-Only Bos Dashboard)
  if (user.role === "EXECUTIVE") {
    const overview = await getExecutiveOverview(year, month);
    const { hrOperations, hrAttendanceDiscipline, staffScorecards } = overview;

    return (
      <StaggerContainer className="space-y-6">
        {/* Header Executive */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
            <div className="space-y-1">
              <h2
                className="font-display font-semibold tracking-tight text-[#1B1C1E]"
                style={{ fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)" }}
              >
                Executive Oversight
              </h2>
              <p className="text-xs sm:text-sm text-[#73757D]">
                Pemantauan read-only atas kedisiplinan HR, ketertiban operasional, dan performa
                seluruh staf
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-[#1B1C1E] bg-white border border-[#E2DED3] px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Read-Only · Periode {monthPrefix}</span>
            </span>
          </div>
        </StaggerItem>

        {/* Executive Metric Ribbon */}
        <StaggerItem>
          <MetricRibbon
            items={[
              {
                label: "Staf aktif & probation",
                value: overview.activeEmployeeCount,
                helper: "Profil kepegawaian aktif",
                accent: "neutral",
              },
              {
                label: "Antrean cuti pending",
                value: hrOperations.leavePendingCount,
                helper:
                  hrOperations.avgLeaveProcessingHours !== null
                    ? `Rata-rata respon HR: ${hrOperations.avgLeaveProcessingHours} jam`
                    : "Belum ada riwayat review",
                accent: hrOperations.leavePendingCount > 0 ? "amber" : "emerald",
              },
              {
                label: "Total payroll periode",
                value: formatIDR(hrOperations.payrollTotalNet),
                helper: `${hrOperations.payrollPaidCount} cair · ${hrOperations.payrollProcessedCount} verifikasi · ${hrOperations.payrollDraftCount} draft`,
                accent: "blue",
              },
              {
                label: "Cakupan review KPI",
                value: `${hrOperations.performanceCoveragePercent}%`,
                helper: `${hrOperations.performanceReviewedCount} dari ${overview.activeEmployeeCount} staf dinilai`,
                accent: "emerald",
              },
            ]}
          />
        </StaggerItem>

        {/* Kedisiplinan Absensi HR & Ketertiban Operasional HR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left (7 cols): Kedisiplinan Absensi HR */}
          <StaggerItem className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Kedisiplinan Absensi HR</CardTitle>
                    <CardDescription>
                      Audit kehadiran staf HR Admin yang memiliki profil pegawai ({monthPrefix})
                    </CardDescription>
                  </div>
                  <Link
                    href="/presensi"
                    className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Log tim</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hrAttendanceDiscipline.length === 0 ? (
                  <EmptyState
                    title="Tidak Ada Staf HR dengan Profil Pegawai"
                    description="Akun HR_ADMIN yang aktif tidak memiliki profil kepegawaian untuk diawasi."
                  />
                ) : (
                  hrAttendanceDiscipline.map((hr) => (
                    <div
                      key={hr.employeeId}
                      className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E2DED3] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#1B1C1E]">{hr.fullName}</p>
                          <p className="text-xs text-[#73757D]">
                            {hr.employeeCode} · {hr.position} ({hr.department})
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {hr.presentCount} Hadir
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {hr.lateCount} Telat ({hr.totalLateMinutes}m)
                          </span>
                        </div>
                      </div>

                      {hr.recentLogs.length > 0 && (
                        <div className="divide-y divide-[#E2DED3]/70 border-t border-[#E2DED3]/80 pt-2">
                          {hr.recentLogs.map((log) => (
                            <div
                              key={log.id}
                              className="py-2 flex flex-wrap items-center justify-between text-xs gap-2"
                            >
                              <span className="font-mono tabular-nums text-[#4E5058]">
                                {log.date}
                              </span>
                              <span className="font-mono tabular-nums text-[#1B1C1E]">
                                {formatTimeWIB(log.clockIn)} WIB
                              </span>
                              <div className="flex items-center gap-1.5">
                                <StatusBadge status={log.status} size="sm" />
                                <StatusBadge status={log.isWfo ? "WFO" : "WFH"} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Right (5 cols): Ketertiban Operasional HR */}
          <StaggerItem className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ketertiban Operasional HR</CardTitle>
                <CardDescription>
                  Ringkasan SLA persetujuan cuti, siklus payroll, & evaluasi KPI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E2DED3] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#4E5058]">Status Permohonan Cuti</span>
                    <span className="font-mono text-[#73757D]">
                      {hrOperations.avgLeaveProcessingHours !== null
                        ? `SLA ~${hrOperations.avgLeaveProcessingHours}j`
                        : "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Pending</p>
                      <p className="font-mono font-bold text-amber-700 tabular-nums">
                        {hrOperations.leavePendingCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Disetujui</p>
                      <p className="font-mono font-bold text-emerald-700 tabular-nums">
                        {hrOperations.leaveApprovedCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Ditolak</p>
                      <p className="font-mono font-bold text-rose-700 tabular-nums">
                        {hrOperations.leaveRejectedCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E2DED3] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#4E5058]">
                      Siklus Payroll {month}/{year}
                    </span>
                    <Link
                      href="/payroll"
                      className="text-xs font-semibold text-[#1B1C1E] hover:underline"
                    >
                      Lihat rincian
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Draft</p>
                      <p className="font-mono font-bold text-amber-700 tabular-nums">
                        {hrOperations.payrollDraftCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Diproses</p>
                      <p className="font-mono font-bold text-blue-700 tabular-nums">
                        {hrOperations.payrollProcessedCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#E2DED3]">
                      <p className="text-[11px] text-[#73757D]">Cair</p>
                      <p className="font-mono font-bold text-emerald-700 tabular-nums">
                        {hrOperations.payrollPaidCount}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>

        {/* Ringkasan Performa & Kehadiran Seluruh Staf (Termasuk HR) */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Performa & Kehadiran Seluruh Staf (Termasuk HR)</CardTitle>
                  <CardDescription>
                    Perbandingan objektif kehadiran, ketepatan waktu, dan capaian KPI lintas divisi
                  </CardDescription>
                </div>
                <Link
                  href="/performa"
                  className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Scorecard lengkap</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="overflow-x-auto focus:outline-none"
                tabIndex={0}
                role="region"
                aria-label="Tabel Perbandingan Performa Staf dan HR"
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F4] border-b border-[#E2DED3] text-[#73757D] font-semibold">
                      <th className="py-3 px-5">Staf</th>
                      <th className="py-3 px-4">Peran</th>
                      <th className="py-3 px-4 text-right">Kehadiran</th>
                      <th className="py-3 px-4 text-right">Ketepatan Waktu</th>
                      <th className="py-3 px-4 text-right">Target KPI</th>
                      <th className="py-3 px-5 text-right">Skor Komposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DED3]/60">
                    {staffScorecards.map((row) => {
                      const composite = Number(
                        (
                          row.attendanceRate * 0.3 +
                          row.punctualityRate * 0.3 +
                          row.taskCompletionRate * 0.4
                        ).toFixed(1)
                      );
                      return (
                        <tr
                          key={row.employeeId}
                          className="h-[52px] hover:bg-[#FAF8F4]/70 transition-colors"
                        >
                          <td className="py-3 px-5">
                            <p className="font-semibold text-[#1B1C1E]">{row.employeeName}</p>
                            <p className="text-[11px] text-[#73757D]">
                              {row.employeeCode} · {row.department}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={row.role ?? "EMPLOYEE"} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-[#1B1C1E]">
                            {row.attendanceRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                            {row.punctualityRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-700">
                            {row.taskCompletionRate}%
                          </td>
                          <td className="py-3 px-5 text-right font-mono font-bold tabular-nums text-[#1B1C1E]">
                            {composite} / 100
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  // 2. EMPLOYEE View (Requires EmployeeProfile)
  if (user.role === "EMPLOYEE") {
    const profile = user.employeeProfile;
    if (!profile || profile.status === EmploymentStatus.RESIGNED) {
      return (
        <div className="p-8 bg-white border border-[#E2DED3] rounded-2xl">
          <EmptyState
            icon={<UserX className="w-5 h-5 stroke-[1.5]" />}
            title="Profil Karyawan Belum Aktif"
            description="Akun ini belum terhubung ke profil kepegawaian aktif. Hubungi HR Admin untuk sinkronisasi data."
          />
        </div>
      );
    }

    const summary = await getAttendanceSummary(profile.id, year, month);
    const leaves = await listLeaveRequests({ employeeId: profile.id });
    const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;
    const payrolls = await listPayrolls({ employeeId: profile.id });
    const latestPayroll = payrolls[0] ?? null;

    const objective = await computeObjectiveRates(profile.id, year, month);
    const performance = await prisma.performance.findUnique({
      where: {
        employeeId_periodMonth_periodYear: {
          employeeId: profile.id,
          periodMonth: month,
          periodYear: year,
        },
      },
    });

    const todayRecord = summary.todayRecord;

    return (
      <StaggerContainer className="space-y-6">
        {/* Welcome Banner */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
            <div className="space-y-1">
              <h2
                className="font-display font-semibold tracking-tight text-[#1B1C1E]"
                style={{ fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)" }}
              >
                Selamat bekerja, {profile.fullName}
              </h2>
              <p className="text-xs sm:text-sm text-[#73757D]">
                {profile.position} — Divisi {profile.department} ({profile.employeeCode})
              </p>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-white border border-[#E2DED3] px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <span className="text-xs text-[#73757D]">Sisa kuota cuti</span>
              <span className="text-xs font-bold text-[#1B1C1E] font-mono tabular-nums">
                {profile.leaveQuota} hari
              </span>
            </div>
          </div>
        </StaggerItem>

        {/* Asymmetric 12-Col Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Smart Attendance Pulse */}
          <StaggerItem className="lg:col-span-5 flex flex-col gap-6">
            <Card className="flex-1 flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#73757D]" />
                      <span>Status Presensi Hari Ini</span>
                    </CardTitle>
                    {todayRecord ? (
                      <StatusBadge status={todayRecord.status} size="sm" />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        Belum Presensi
                      </span>
                    )}
                  </div>
                  <CardDescription>{todayStr} · Jam Kerja 09:00 WIB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayRecord ? (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#73757D]">Waktu Masuk:</span>
                          <span className="font-mono font-semibold text-[#1B1C1E] tabular-nums">
                            {formatTimeWIB(todayRecord.clockIn)} WIB
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#73757D]">Waktu Keluar:</span>
                          <span className="font-mono font-semibold text-[#1B1C1E] tabular-nums">
                            {formatTimeWIB(todayRecord.clockIn)} WIB
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#73757D]">Tipe Kehadiran:</span>
                          <StatusBadge status={todayRecord.isWfo ? "WFO" : "WFH"} size="sm" />
                        </div>
                      </div>
                      {todayRecord.lateMinutes > 0 && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          Terlambat {todayRecord.lateMinutes} menit dari jadwal kantor.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-4 ring-amber-500/10">
                        <Clock className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-semibold text-[#1B1C1E]">
                        Anda Belum Melakukan Clock-In
                      </p>
                      <p className="text-xs text-[#73757D] max-w-xs mx-auto">
                        Presensi mandiri menggunakan verifikasi radius GPS kantor 100m.
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>
              <CardFooter>
                <Link
                  href="/presensi"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#F7C331] hover:bg-[#EAB31C] text-[#1B1C1E] transition-colors cursor-pointer"
                >
                  <span>Buka Terminal Presensi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          </StaggerItem>

          {/* Right Column (7 Cols): High-Density Metric Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StaggerItem>
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#73757D]" />
                      <span>Cuti Tahunan</span>
                    </CardTitle>
                    <CardDescription>Hak cuti berbayar karyawan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono tabular-nums text-[#1B1C1E]">
                        {profile.leaveQuota}
                      </span>
                      <span className="text-xs text-[#73757D]">Hari tersisa tahun ini</span>
                    </div>
                    <div className="text-xs text-[#73757D] flex items-center justify-between pt-2 border-t border-[#E2DED3]">
                      <span>Pengajuan Menunggu:</span>
                      <span className="font-semibold text-[#1B1C1E] font-mono tabular-nums">
                        {pendingLeavesCount} pengajuan
                      </span>
                    </div>
                  </CardContent>
                </div>
                <CardFooter>
                  <Link
                    href="/cuti"
                    className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1"
                  >
                    <span>Kelola Pengajuan Cuti</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#73757D]" />
                      <span>Slip Gaji Terakhir</span>
                    </CardTitle>
                    <CardDescription>
                      {latestPayroll
                        ? `Bulan ${latestPayroll.periodMonth}/${latestPayroll.periodYear}`
                        : "Belum ada riwayat"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {latestPayroll ? (
                      <div>
                        <span className="text-2xl font-bold font-mono tabular-nums text-[#1B1C1E]">
                          {formatIDR(latestPayroll.netSalary)}
                        </span>
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#E2DED3]">
                          <span className="text-xs text-[#73757D]">Status:</span>
                          <StatusBadge status={latestPayroll.status} size="sm" />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#73757D]">
                        Slip gaji bulan ini belum diterbitkan oleh HR.
                      </p>
                    )}
                  </CardContent>
                </div>
                <CardFooter>
                  <Link
                    href="/payroll"
                    className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Rincian Slip Gaji</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            </StaggerItem>

            <StaggerItem className="md:col-span-2">
              <Card className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#73757D]" />
                        <span>
                          Ringkasan Performa Bulan {month}/{year}
                        </span>
                      </CardTitle>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full ring-1 ring-inset ring-emerald-600/20">
                        Aktif
                      </span>
                    </div>
                    <CardDescription>
                      Dihitung live dari rekap presensi dan review manajer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                      <div className="p-3 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                        <p className="text-xs text-[#73757D] font-medium mb-1">Kehadiran</p>
                        <p className="text-xl font-bold font-mono tabular-nums text-[#1B1C1E]">
                          {objective.attendanceRate}%
                        </p>
                      </div>
                      <div className="p-3 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                        <p className="text-xs text-[#73757D] font-medium mb-1">Ketepatan waktu</p>
                        <p className="text-xl font-bold font-mono tabular-nums text-[#1B1C1E]">
                          {objective.punctualityRate}%
                        </p>
                      </div>
                      <div className="p-3 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                        <p className="text-xs text-[#73757D] font-medium mb-1">Tugas (KPI)</p>
                        <p className="text-xl font-bold font-mono tabular-nums text-[#1B1C1E]">
                          {Number(performance?.taskCompletionRate ?? 0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>
                <CardFooter>
                  <Link
                    href="/performa"
                    className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Scorecard KPI Lengkap</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            </StaggerItem>
          </div>
        </div>
      </StaggerContainer>
    );
  }

  // 3. HR_ADMIN Data View (Works with or without EmployeeProfile)
  const [totalEmployees, allMonthlyAttendances, pendingLeaves, currentPayrolls] = await Promise.all(
    [
      prisma.employeeProfile.count({
        where: { status: { in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION] } },
      }),
      listAttendances({ monthPrefix }),
      listLeaveRequests({ status: LeaveStatus.PENDING }),
      listPayrolls({ periodYear: year, periodMonth: month }),
    ]
  );

  const todayAttendances = allMonthlyAttendances.filter((a) => a.date === todayStr);
  const presentCount = todayAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount = todayAttendances.filter((a) => a.status === "LATE").length;
  const onLeaveCount = todayAttendances.filter((a) => a.status === "ON_LEAVE").length;

  const recentFive = todayAttendances.slice(0, 5);

  return (
    <StaggerContainer className="space-y-6">
      {/* Header Admin */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
          <div className="space-y-1">
            <h2
              className="font-display font-semibold tracking-tight text-[#1B1C1E]"
              style={{ fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)" }}
            >
              Ringkasan Operasional HR
            </h2>
            <p className="text-xs sm:text-sm text-[#73757D]">
              Pantau kehadiran tim, antrean cuti, dan siklus penggajian hari ini
            </p>
          </div>
          <Link
            href="/pengaturan"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#1B1C1E] bg-white border border-[#E2DED3] px-3.5 py-2 rounded-xl hover:bg-[#EDEAE1] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-[#73757D]" />
            <span>Pengaturan geofence</span>
          </Link>
        </div>
      </StaggerItem>

      {/* Headcount Architectural Metric Ribbon */}
      <StaggerItem>
        <MetricRibbon
          items={[
            {
              label: "Total karyawan",
              value: totalEmployees,
              helper: "Profil kepegawaian aktif",
              accent: "neutral",
            },
            {
              label: "Hadir tepat waktu",
              value: presentCount,
              helper: "Sebelum 09:00 WIB",
              accent: "emerald",
            },
            {
              label: "Terlambat",
              value: lateCount,
              helper: "Dikenakan denda slip",
              accent: "amber",
            },
            {
              label: "Cuti & izin",
              value: onLeaveCount,
              helper: "Disetujui sistem",
              accent: "blue",
            },
          ]}
        />
      </StaggerItem>

      {/* Asymmetric 12-Col Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <StaggerItem className="lg:col-span-5 space-y-6">
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#73757D]" />
                    <span>Antrean Persetujuan Cuti</span>
                  </CardTitle>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 tabular-nums">
                    {pendingLeaves.length} Pending
                  </span>
                </div>
                <CardDescription>Memerlukan review dan persetujuan HR</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLeaves.length > 0 ? (
                  <div className="divide-y divide-[#E2DED3]/70">
                    {pendingLeaves.slice(0, 3).map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-[#1B1C1E]">
                            {item.employeeName}
                          </p>
                          <span className="text-[11px] font-mono tabular-nums text-[#73757D]">
                            {item.totalDays} hari ({item.leaveType})
                          </span>
                        </div>
                        <p className="text-xs text-[#73757D] line-clamp-1 mb-1">
                          &ldquo;{item.reason}&rdquo;
                        </p>
                        <p className="text-[10px] text-[#73757D] font-mono tabular-nums">
                          {item.startDate} s/d {item.endDate}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#73757D]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>Semua pengajuan cuti telah diproses.</span>
                  </div>
                )}
              </CardContent>
            </div>
            <CardFooter>
              <Link
                href="/cuti"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#F7C331] hover:bg-[#EAB31C] text-[#1B1C1E] transition-colors cursor-pointer"
              >
                <span>Buka Panel Approval Cuti</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#73757D]" />
                  <span>
                    Status Payroll {month}/{year}
                  </span>
                </CardTitle>
                <Link
                  href="/payroll"
                  className="text-xs font-semibold text-[#1B1C1E] hover:underline"
                >
                  Kelola
                </Link>
              </div>
              <CardDescription>
                {currentPayrolls.length} dari {totalEmployees} slip gaji tercatat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                  <p className="text-[11px] text-[#73757D] font-medium">Draft</p>
                  <p className="text-base font-bold font-mono text-amber-700 tabular-nums">
                    {currentPayrolls.filter((p) => p.status === "DRAFT").length}
                  </p>
                </div>
                <div className="p-2.5 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                  <p className="text-[11px] text-[#73757D] font-medium">Diproses</p>
                  <p className="text-base font-bold font-mono text-blue-700 tabular-nums">
                    {currentPayrolls.filter((p) => p.status === "PROCESSED").length}
                  </p>
                </div>
                <div className="p-2.5 bg-[#FAF8F4] border border-[#E2DED3] rounded-xl">
                  <p className="text-[11px] text-[#73757D] font-medium">Cair</p>
                  <p className="text-base font-bold font-mono text-emerald-700 tabular-nums">
                    {currentPayrolls.filter((p) => p.status === "PAID").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#73757D]" />
                    <span>Aktivitas Presensi Hari Ini</span>
                  </CardTitle>
                  <Link
                    href="/presensi"
                    className="text-xs font-semibold text-[#1B1C1E] hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <CardDescription>Log real-time kehadiran karyawan per {todayStr}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {recentFive.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F4] border-y border-[#E2DED3] text-[#73757D] font-semibold">
                          <th className="py-2.5 px-5">Karyawan</th>
                          <th className="py-2.5 px-3">Jam Masuk</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-5 text-right">Jarak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DED3]/50">
                        {recentFive.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-[#FAF8F4]/70 transition-colors h-[52px]"
                          >
                            <td className="py-3 px-5">
                              <p className="font-semibold text-[#1B1C1E]">{row.employeeName}</p>
                              <p className="text-[11px] text-[#73757D]">{row.department}</p>
                            </td>
                            <td className="py-3 px-3 font-mono tabular-nums text-[#1B1C1E]">
                              {formatTimeWIB(row.clockIn)} WIB
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={row.status} size="sm" />
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={row.isWfo ? "WFO" : "WFH"} size="sm" />
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums text-[#73757D]">
                              {row.distanceMeter !== null ? `${row.distanceMeter}m` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="Belum Ada Presensi Tercatat Hari Ini"
                      description="Karyawan yang melakukan clock-in akan muncul di tabel monitoring ini secara real-time."
                      action={
                        user.employeeProfile
                          ? {
                              label: "Buka Terminal Presensi",
                              href: "/presensi",
                            }
                          : undefined
                      }
                    />
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
