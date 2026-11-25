import {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  PayrollStatus,
  Role,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { mapAttendance } from "./attendance.service";
import { getTeamPerformanceScorecards } from "./performance.service";
import {
  ExecutiveHrAttendanceItemDTO,
  ExecutiveOverviewDTO,
} from "@/types";

export async function getExecutiveOverview(
  year: number,
  month: number
): Promise<ExecutiveOverviewDTO> {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const [
    hrProfiles,
    allLeaves,
    periodPayrolls,
    staffScorecards,
  ] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: {
        status: { in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION] },
        user: { role: Role.HR_ADMIN, isActive: true },
      },
      orderBy: { employeeCode: "asc" },
    }),
    prisma.leaveRequest.findMany({
      select: {
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.payroll.findMany({
      where: { periodYear: year, periodMonth: month },
      select: { status: true, netSalary: true },
    }),
    getTeamPerformanceScorecards(year, month),
  ]);

  const hrIds = hrProfiles.map((h) => h.id);
  const hrAttendances =
    hrIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            employeeId: { in: hrIds },
            date: { startsWith: monthPrefix },
          },
          orderBy: [{ date: "desc" }, { clockIn: "desc" }],
        })
      : [];

  const hrAttendanceMap = new Map<string, typeof hrAttendances>();
  for (const row of hrAttendances) {
    const list = hrAttendanceMap.get(row.employeeId) ?? [];
    list.push(row);
    hrAttendanceMap.set(row.employeeId, list);
  }

  const hrAttendanceDiscipline: ExecutiveHrAttendanceItemDTO[] = hrProfiles.map(
    (hr) => {
      const logs = hrAttendanceMap.get(hr.id) ?? [];
      const presentCount = logs.filter(
        (l) => l.status === AttendanceStatus.PRESENT
      ).length;
      const lateCount = logs.filter(
        (l) => l.status === AttendanceStatus.LATE
      ).length;
      const onLeaveCount = logs.filter(
        (l) => l.status === AttendanceStatus.ON_LEAVE
      ).length;
      const totalLateMinutes = logs.reduce((sum, l) => sum + l.lateMinutes, 0);

      return {
        employeeId: hr.id,
        employeeCode: hr.employeeCode,
        fullName: hr.fullName,
        department: hr.department,
        position: hr.position,
        presentCount,
        lateCount,
        onLeaveCount,
        totalLateMinutes,
        recentLogs: logs.slice(0, 5).map((l) => ({
          ...mapAttendance(l),
          employeeCode: hr.employeeCode,
          employeeName: hr.fullName,
          department: hr.department,
        })),
      };
    }
  );

  const leavePendingCount = allLeaves.filter(
    (l) => l.status === LeaveStatus.PENDING
  ).length;
  const leaveApprovedCount = allLeaves.filter(
    (l) => l.status === LeaveStatus.APPROVED
  ).length;
  const leaveRejectedCount = allLeaves.filter(
    (l) => l.status === LeaveStatus.REJECTED
  ).length;

  const reviewedDurationsHours = allLeaves
    .filter((l) => l.reviewedAt !== null)
    .map(
      (l) =>
        Math.max(0, l.reviewedAt!.getTime() - l.createdAt.getTime()) /
        (1000 * 60 * 60)
    );

  const avgLeaveProcessingHours =
    reviewedDurationsHours.length > 0
      ? Number(
          (
            reviewedDurationsHours.reduce((sum, h) => sum + h, 0) /
            reviewedDurationsHours.length
          ).toFixed(1)
        )
      : null;

  const payrollDraftCount = periodPayrolls.filter(
    (p) => p.status === PayrollStatus.DRAFT
  ).length;
  const payrollProcessedCount = periodPayrolls.filter(
    (p) => p.status === PayrollStatus.PROCESSED
  ).length;
  const payrollPaidCount = periodPayrolls.filter(
    (p) => p.status === PayrollStatus.PAID
  ).length;
  const payrollTotalNet = periodPayrolls.reduce(
    (sum, p) => sum + Number(p.netSalary),
    0
  );

  const activeEmployeeCount = staffScorecards.length;
  const performanceReviewedCount = staffScorecards.filter(
    (s) => s.id !== null
  ).length;
  const performanceCoveragePercent =
    activeEmployeeCount > 0
      ? Number(
          ((performanceReviewedCount / activeEmployeeCount) * 100).toFixed(1)
        )
      : 100;

  return {
    periodMonth: month,
    periodYear: year,
    activeEmployeeCount,
    hrAttendanceDiscipline,
    hrOperations: {
      leavePendingCount,
      leaveApprovedCount,
      leaveRejectedCount,
      avgLeaveProcessingHours,
      payrollDraftCount,
      payrollProcessedCount,
      payrollPaidCount,
      payrollTotalNet,
      performanceReviewedCount,
      performanceCoveragePercent,
    },
    staffScorecards,
  };
}
