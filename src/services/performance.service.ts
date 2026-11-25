import { AttendanceStatus, EmploymentStatus } from "@/generated/prisma/client";
import { getEffectiveWorkingDays } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getAttendanceSummary } from "./attendance.service";
import { PerformanceDTO } from "@/types";

function calculateRatesFromCounts(
  effectiveWorkingDays: number,
  presentDays: number,
  lateDays: number,
  onLeaveDays: number
) {
  const attendedOrLeave = presentDays + lateDays + onLeaveDays;
  const attendanceRate =
    effectiveWorkingDays > 0
      ? Number(((attendedOrLeave / effectiveWorkingDays) * 100).toFixed(2))
      : 100;

  const totalPresentWorkdays = presentDays + lateDays;
  const punctualityRate =
    totalPresentWorkdays > 0
      ? Number(((presentDays / totalPresentWorkdays) * 100).toFixed(2))
      : 100;

  return { attendanceRate, punctualityRate };
}

export async function computeObjectiveRates(
  employeeId: string,
  periodYear: number,
  periodMonth: number
) {
  const summary = await getAttendanceSummary(employeeId, periodYear, periodMonth);
  return calculateRatesFromCounts(
    summary.effectiveWorkingDays,
    summary.presentDays,
    summary.lateDays,
    summary.onLeaveDays
  );
}

export async function upsertPerformanceReview(input: {
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  taskCompletionRate: number;
  managerNotes?: string;
}): Promise<PerformanceDTO> {
  const { attendanceRate, punctualityRate } = await computeObjectiveRates(
    input.employeeId,
    input.periodYear,
    input.periodMonth
  );

  const saved = await prisma.performance.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: input.employeeId,
        periodMonth: input.periodMonth,
        periodYear: input.periodYear,
      },
    },
    update: {
      attendanceRate,
      punctualityRate,
      taskCompletionRate: input.taskCompletionRate,
      managerNotes: input.managerNotes?.trim() || null,
    },
    create: {
      employeeId: input.employeeId,
      periodMonth: input.periodMonth,
      periodYear: input.periodYear,
      attendanceRate,
      punctualityRate,
      taskCompletionRate: input.taskCompletionRate,
      managerNotes: input.managerNotes?.trim() || null,
    },
  });

  return {
    id: saved.id,
    employeeId: saved.employeeId,
    periodMonth: saved.periodMonth,
    periodYear: saved.periodYear,
    attendanceRate: Number(saved.attendanceRate),
    punctualityRate: Number(saved.punctualityRate),
    taskCompletionRate: Number(saved.taskCompletionRate),
    managerNotes: saved.managerNotes,
  };
}

export async function getTeamPerformanceScorecards(
  periodYear: number,
  periodMonth: number,
  filterEmployeeId?: string
): Promise<PerformanceDTO[]> {
  const monthPrefix = `${periodYear}-${String(periodMonth).padStart(2, "0")}`;
  const effectiveWorkingDays = getEffectiveWorkingDays(periodYear, periodMonth);

  const [profiles, savedReviews, monthAttendances] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: {
        ...(filterEmployeeId ? { id: filterEmployeeId } : {}),
        status: { in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION] },
      },
      include: {
        user: { select: { role: true } },
      },
      orderBy: { employeeCode: "asc" },
    }),
    prisma.performance.findMany({
      where: {
        periodMonth,
        periodYear,
        ...(filterEmployeeId ? { employeeId: filterEmployeeId } : {}),
      },
    }),
    prisma.attendance.findMany({
      where: {
        date: { startsWith: monthPrefix },
        ...(filterEmployeeId ? { employeeId: filterEmployeeId } : {}),
      },
      select: { employeeId: true, status: true },
    }),
  ]);

  const savedMap = new Map(savedReviews.map((s) => [s.employeeId, s]));
  const countsMap = new Map<
    string,
    { present: number; late: number; leave: number }
  >();

  for (const row of monthAttendances) {
    const entry = countsMap.get(row.employeeId) ?? {
      present: 0,
      late: 0,
      leave: 0,
    };
    if (row.status === AttendanceStatus.PRESENT) entry.present += 1;
    else if (row.status === AttendanceStatus.LATE) entry.late += 1;
    else if (row.status === AttendanceStatus.ON_LEAVE) entry.leave += 1;
    countsMap.set(row.employeeId, entry);
  }

  return profiles.map((profile) => {
    const saved = savedMap.get(profile.id);
    const counts = countsMap.get(profile.id) ?? {
      present: 0,
      late: 0,
      leave: 0,
    };
    const liveRates = calculateRatesFromCounts(
      effectiveWorkingDays,
      counts.present,
      counts.late,
      counts.leave
    );

    return {
      id: saved?.id ?? null,
      employeeId: profile.id,
      employeeCode: profile.employeeCode,
      employeeName: profile.fullName,
      position: profile.position,
      department: profile.department,
      role: profile.user.role,
      periodMonth,
      periodYear,
      attendanceRate: liveRates.attendanceRate,
      punctualityRate: liveRates.punctualityRate,
      taskCompletionRate: saved ? Number(saved.taskCompletionRate) : 0,
      managerNotes: saved?.managerNotes ?? null,
    };
  });
}
