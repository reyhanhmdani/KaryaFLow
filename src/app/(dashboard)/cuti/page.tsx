import React from "react";
import { requireUser } from "@/lib/auth";
import { listLeaveRequests } from "@/services/leave.service";
import { LeaveApprovalTable } from "@/components/modules/leave/LeaveApprovalTable";
import { LeaveRequestTrigger } from "@/components/modules/leave/LeaveRequestTrigger";
import { MetricRibbon } from "@/components/ui/MetricRibbon";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { AutoRefresh } from "@/components/ui/AutoRefresh";

export default async function CutiPage() {
  const user = await requireUser();
  const isHrAdmin = user.role === "HR_ADMIN";
  const isExecutive = user.role === "EXECUTIVE";
  const canMonitorAll = isHrAdmin || isExecutive;
  const profile = user.employeeProfile;
  const canSubmitLeave = Boolean(profile && profile.status !== "RESIGNED");

  const leaveRequests = canMonitorAll
    ? await listLeaveRequests()
    : profile
    ? await listLeaveRequests({ employeeId: profile.id })
    : [];

  const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = leaveRequests.filter((r) => r.status === "REJECTED").length;

  return (
    <StaggerContainer className="space-y-6">
      {/* Header & Quick Action */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
          <div className="space-y-1">
            <h2
              className="font-display font-semibold tracking-tight text-[#1B1C1E]"
              style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
            >
              Pengajuan & Persetujuan Cuti
            </h2>
            <p className="text-xs sm:text-sm text-[#73757D]">
              {isExecutive
                ? "Pantauan read-only ketertiban pemrosesan cuti oleh HR"
                : isHrAdmin
                ? "Panel persetujuan permohonan cuti dan manajemen kuota karyawan"
                : "Kelola hak cuti tahunan dan pantau status persetujuan HR"}
            </p>
          </div>
          {canSubmitLeave && profile && (
            <LeaveRequestTrigger leaveQuota={profile.leaveQuota} />
          )}
        </div>
      </StaggerItem>

      {/* Quota & Status Ribbon */}
      <StaggerItem>
        <MetricRibbon
          items={[
            {
              label: profile ? "Sisa kuota tahunan" : "Total permohonan",
              value: profile ? `${profile.leaveQuota} hari` : leaveRequests.length,
              helper: profile ? "Tersedia tahun berjalan" : "Seluruh catatan sistem",
              accent: "neutral",
            },
            {
              label: "Menunggu approval",
              value: pendingCount,
              helper: "Perlu ditinjau HR",
              accent: "amber",
            },
            {
              label: "Disetujui",
              value: approvedCount,
              helper: "Tercatat otomatis di presensi",
              accent: "emerald",
            },
            {
              label: "Ditolak",
              value: rejectedCount,
              helper: "Disertai catatan penolakan",
              accent: "rose",
            },
          ]}
        />
      </StaggerItem>

      {/* Leave Approval Table */}
      <StaggerItem className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-base font-semibold text-[#1B1C1E]">
              {canMonitorAll ? "Antrean & histori seluruh tim" : "Histori pengajuan Anda"}
            </h3>
            {canMonitorAll && (
              <AutoRefresh intervalMs={25000} showIndicator={true} />
            )}
          </div>
          <span className="text-xs text-[#73757D] font-mono tabular-nums">
            {leaveRequests.length} permohonan
          </span>
        </div>
        <LeaveApprovalTable
          leaveRequests={leaveRequests}
          isHrAdmin={isHrAdmin}
          canMonitorAll={canMonitorAll}
          currentEmployeeId={profile?.id ?? null}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
