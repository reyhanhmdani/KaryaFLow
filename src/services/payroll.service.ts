import {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
  PayrollStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PayrollDTO } from "@/types";

const LATE_PENALTY_IDR = 25000;
const WORKING_DAYS_DIVISOR = 22;
const TAX_BPJS_RATE = 0.05;

export async function generateMonthlyPayroll(
  periodMonth: number,
  periodYear: number
): Promise<PayrollDTO[]> {
  const monthPrefix = `${periodYear}-${String(periodMonth).padStart(2, "0")}`;
  const monthStart = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
  const monthEnd = new Date(Date.UTC(periodYear, periodMonth, 0));

  const [profiles, existingPayrolls, lateGroups, unpaidLeaveGroups] =
    await Promise.all([
      prisma.employeeProfile.findMany({
        where: {
          status: { in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION] },
        },
        orderBy: { employeeCode: "asc" },
      }),
      prisma.payroll.findMany({ where: { periodMonth, periodYear } }),
      prisma.attendance.groupBy({
        by: ["employeeId"],
        where: {
          date: { startsWith: monthPrefix },
          status: AttendanceStatus.LATE,
        },
        _count: { _all: true },
      }),
      prisma.leaveRequest.groupBy({
        by: ["employeeId"],
        where: {
          leaveType: LeaveType.SPECIAL,
          status: LeaveStatus.APPROVED,
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
        _sum: { totalDays: true },
      }),
    ]);

  const existingMap = new Map(existingPayrolls.map((p) => [p.employeeId, p]));
  const lateMap = new Map(
    lateGroups.map((g) => [g.employeeId, g._count._all])
  );
  const unpaidMap = new Map(
    unpaidLeaveGroups.map((g) => [g.employeeId, g._sum.totalDays ?? 0])
  );

  const results: PayrollDTO[] = [];

  for (const profile of profiles) {
    const existing = existingMap.get(profile.id);

    // Lindungi slip gaji yang sudah diverifikasi (PROCESSED) atau cair (PAID)
    if (
      existing?.status === PayrollStatus.PAID ||
      existing?.status === PayrollStatus.PROCESSED
    ) {
      results.push({
        ...mapPayroll(existing),
        employeeCode: profile.employeeCode,
        employeeName: profile.fullName,
        position: profile.position,
        department: profile.department,
      });
      continue;
    }

    const lateCount = lateMap.get(profile.id) ?? 0;
    const unpaidLeaveDays = unpaidMap.get(profile.id) ?? 0;
    const baseSalary = Number(profile.baseSalary);
    const allowances = Number(profile.fixedAllowance);

    const lateDeduction = lateCount * LATE_PENALTY_IDR;
    const unpaidLeaveDeduction = Math.round(
      unpaidLeaveDays * (baseSalary / WORKING_DAYS_DIVISOR)
    );
    const taxBpjsDeduction = Math.round(baseSalary * TAX_BPJS_RATE);
    const netSalary =
      baseSalary +
      allowances -
      (lateDeduction + unpaidLeaveDeduction + taxBpjsDeduction);

    const saved = await prisma.payroll.upsert({
      where: {
        employeeId_periodMonth_periodYear: {
          employeeId: profile.id,
          periodMonth,
          periodYear,
        },
      },
      update: {
        baseSalary,
        allowances,
        lateCount,
        lateDeduction,
        unpaidLeaveDays,
        unpaidLeaveDeduction,
        taxBpjsDeduction,
        netSalary,
        status: PayrollStatus.DRAFT,
      },
      create: {
        employeeId: profile.id,
        periodMonth,
        periodYear,
        baseSalary,
        allowances,
        lateCount,
        lateDeduction,
        unpaidLeaveDays,
        unpaidLeaveDeduction,
        taxBpjsDeduction,
        netSalary,
        status: PayrollStatus.DRAFT,
      },
    });

    results.push({
      ...mapPayroll(saved),
      employeeCode: profile.employeeCode,
      employeeName: profile.fullName,
      position: profile.position,
      department: profile.department,
    });
  }

  return results;
}

export async function updatePayrollStatus(
  payrollId: string,
  nextStatus: "PROCESSED" | "PAID"
): Promise<PayrollDTO> {
  const current = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!current) throw new Error("Data payroll tidak ditemukan.");

  if (current.status === PayrollStatus.PAID) {
    throw new Error("Slip Gaji berstatus PAID sudah terkunci permanen.");
  }
  if (nextStatus === "PAID" && current.status !== PayrollStatus.PROCESSED) {
    throw new Error(
      "Payroll harus diverifikasi (PROCESSED) sebelum ditandai PAID."
    );
  }

  const updated = await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      status: nextStatus,
      paidAt: nextStatus === "PAID" ? new Date() : null,
    },
  });

  return mapPayroll(updated);
}

export async function listPayrolls(
  filter?:
    | { employeeId?: string; periodYear?: number; periodMonth?: number }
    | string
): Promise<PayrollDTO[]> {
  const where =
    typeof filter === "string"
      ? { employeeId: filter }
      : {
          ...(filter?.employeeId ? { employeeId: filter.employeeId } : {}),
          ...(filter?.periodYear ? { periodYear: filter.periodYear } : {}),
          ...(filter?.periodMonth ? { periodMonth: filter.periodMonth } : {}),
        };

  const rows = await prisma.payroll.findMany({
    where,
    include: {
      employee: {
        select: {
          fullName: true,
          employeeCode: true,
          position: true,
          department: true,
        },
      },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });

  return rows.map((r) => ({
    ...mapPayroll(r),
    employeeCode: r.employee.employeeCode,
    employeeName: r.employee.fullName,
    position: r.employee.position,
    department: r.employee.department,
  }));
}

export async function getPayrollById(id: string): Promise<PayrollDTO | null> {
  const row = await prisma.payroll.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          fullName: true,
          employeeCode: true,
          position: true,
          department: true,
        },
      },
    },
  });
  if (!row) return null;

  return {
    ...mapPayroll(row),
    employeeCode: row.employee.employeeCode,
    employeeName: row.employee.fullName,
    position: row.employee.position,
    department: row.employee.department,
  };
}

function mapPayroll(r: {
  id: string;
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: unknown;
  allowances: unknown;
  lateCount: number;
  lateDeduction: unknown;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: unknown;
  taxBpjsDeduction: unknown;
  netSalary: unknown;
  status: PayrollStatus;
  paidAt: Date | null;
}): PayrollDTO {
  return {
    id: r.id,
    employeeId: r.employeeId,
    periodMonth: r.periodMonth,
    periodYear: r.periodYear,
    baseSalary: Number(r.baseSalary),
    allowances: Number(r.allowances),
    lateCount: r.lateCount,
    lateDeduction: Number(r.lateDeduction),
    unpaidLeaveDays: r.unpaidLeaveDays,
    unpaidLeaveDeduction: Number(r.unpaidLeaveDeduction),
    taxBpjsDeduction: Number(r.taxBpjsDeduction),
    netSalary: Number(r.netSalary),
    status: r.status,
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
  };
}
