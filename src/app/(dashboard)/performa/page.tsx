import React from "react";
import { requireUser } from "@/lib/auth";
import { getTeamPerformanceScorecards } from "@/services/performance.service";
import {
  Award,
  Target,
  Clock4,
  CalendarCheck2,
} from "lucide-react";
import { ScorecardGrid } from "@/components/modules/performance/ScorecardGrid";
import { TeamPerformanceTable } from "@/components/modules/performance/TeamPerformanceTable";
import { PerformancePeriodSelector } from "@/components/modules/performance/PerformancePeriodSelector";
import { MetricRibbon } from "@/components/ui/MetricRibbon";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function PerformaPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const now = new Date();
  const currentMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const currentYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

  const isHrAdmin = user.role === "HR_ADMIN";
  const isExecutive = user.role === "EXECUTIVE";
  const canMonitorAll = isHrAdmin || isExecutive;

  if (canMonitorAll) {
    const teamScorecards = await getTeamPerformanceScorecards(
      currentYear,
      currentMonth
    );

    const totalMembers = teamScorecards.length || 1;
    const avgAttendance = Number(
      (
        teamScorecards.reduce((sum, s) => sum + s.attendanceRate, 0) /
        totalMembers
      ).toFixed(1)
    );
    const avgPunctuality = Number(
      (
        teamScorecards.reduce((sum, s) => sum + s.punctualityRate, 0) /
        totalMembers
      ).toFixed(1)
    );
    const avgTask = Number(
      (
        teamScorecards.reduce((sum, s) => sum + s.taskCompletionRate, 0) /
        totalMembers
      ).toFixed(1)
    );
    const teamComposite = Number(
      (avgAttendance * 0.3 + avgPunctuality * 0.3 + avgTask * 0.4).toFixed(1)
    );

    return (
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
            <div className="space-y-1">
              <h2
                className="font-display font-semibold tracking-tight text-[#1B1C1E]"
                style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
              >
                Performa & Scorecard Tim
              </h2>
              <p className="text-xs sm:text-sm text-[#73757D]">
                {isExecutive
                  ? "Tinjauan read-only indeks kinerja seluruh karyawan dan staf HR"
                  : "Matriks evaluasi kinerja objektif live dan pengisian review kualitatif manajer"}
              </p>
            </div>

            <PerformancePeriodSelector
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <MetricRibbon
            items={[
              {
                label: "Indeks performa tim",
                value: `${teamComposite} / 100`,
                helper: `Rata-rata tertimbang ${teamScorecards.length} staf`,
                accent: "neutral",
                icon: <Award className="w-4 h-4" />,
              },
              {
                label: "Rata-rata kehadiran",
                value: `${avgAttendance}%`,
                helper: "Hari hadir & izin cuti sah",
                accent: "blue",
                icon: <CalendarCheck2 className="w-4 h-4 text-blue-600" />,
              },
              {
                label: "Ketepatan waktu",
                value: `${avgPunctuality}%`,
                helper: "Masuk sebelum batas 09:00 WIB",
                accent: "emerald",
                icon: <Clock4 className="w-4 h-4 text-emerald-600" />,
              },
              {
                label: "Capaian target OKR",
                value: `${avgTask}%`,
                helper: "Pencapaian sprint & target kerja",
                accent: "amber",
                icon: <Target className="w-4 h-4 text-amber-600" />,
              },
            ]}
          />
        </StaggerItem>

        <StaggerItem>
          <TeamPerformanceTable
            scorecards={teamScorecards}
            periodMonth={currentMonth}
            periodYear={currentYear}
            canEdit={isHrAdmin}
          />
        </StaggerItem>
      </StaggerContainer>
    );
  }

  // Employee: Scorecard personal
  const profile = user.employeeProfile;
  if (!profile) {
    return (
      <div className="p-8 bg-white border border-[#E2DED3] rounded-2xl">
        <EmptyState
          title="Profil Karyawan Belum Tersedia"
          description="Akun ini tidak terhubung ke profil kepegawaian aktif untuk menampilkan scorecard KPI."
        />
      </div>
    );
  }

  const personalList = await getTeamPerformanceScorecards(
    currentYear,
    currentMonth,
    profile.id
  );
  const personalScorecard = personalList[0] || {
    id: null,
    employeeId: profile.id,
    employeeCode: profile.employeeCode,
    employeeName: profile.fullName,
    periodMonth: currentMonth,
    periodYear: currentYear,
    attendanceRate: 100,
    punctualityRate: 100,
    taskCompletionRate: 0,
    managerNotes: null,
  };

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
          <div className="space-y-1">
            <h2
              className="font-display font-semibold tracking-tight text-[#1B1C1E]"
              style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
            >
              Scorecard Performa Saya
            </h2>
            <p className="text-xs sm:text-sm text-[#73757D]">
              Transparansi penilaian kinerja bulanan berdasarkan kehadiran live dan evaluasi sprint
            </p>
          </div>

          <PerformancePeriodSelector
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>
      </StaggerItem>

      <StaggerItem>
        <ScorecardGrid
          scorecard={personalScorecard}
          employeeName={profile.fullName}
          position={profile.position}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
