import {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { countWeekdaysInclusive, listWeekdaysInclusive } from "@/lib/date";
import { LeaveRequestDTO } from "@/types";

export async function submitLeaveRequest(
  employeeId: string,
  input: {
    leaveType: LeaveType;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
    reason: string;
  }
): Promise<LeaveRequestDTO> {
  const totalDays = countWeekdaysInclusive(input.startDate, input.endDate);
  if (totalDays <= 0) {
    throw new Error(
      "Rentang tanggal tidak valid atau tidak mengandung hari kerja (Senin–Jumat)."
    );
  }

  const profile = await prisma.employeeProfile.findUnique({
    where: { id: employeeId },
  });
  if (!profile || profile.status === EmploymentStatus.RESIGNED) {
    throw new Error("Akun ini tidak memiliki profil karyawan aktif.");
  }

  if (input.leaveType === "ANNUAL" && totalDays > profile.leaveQuota) {
    throw new Error(
      `Sisa kuota cuti tahunan tidak mencukupi (tersisa ${profile.leaveQuota} hari, diajukan ${totalDays} hari).`
    );
  }

  const start = new Date(`${input.startDate}T00:00:00.000Z`);
  const end = new Date(`${input.endDate}T00:00:00.000Z`);

  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  if (overlapping) {
    throw new Error(
      "Rentang tanggal bertabrakan dengan pengajuan cuti Anda yang sudah ada."
    );
  }

  const created = await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveType: input.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: input.reason.trim(),
      status: LeaveStatus.PENDING,
    },
  });

  return mapLeave(created);
}

export async function reviewLeaveRequest(
  reviewerProfileId: string | null,
  input: {
    requestId: string;
    decision: "APPROVED" | "REJECTED";
    rejectionNote?: string;
  }
): Promise<LeaveRequestDTO> {
  if (
    input.decision === "REJECTED" &&
    (!input.rejectionNote || input.rejectionNote.trim().length < 3)
  ) {
    throw new Error("Alasan penolakan wajib diisi minimal 3 karakter.");
  }

  return prisma.$transaction(async (tx) => {
    const req = await tx.leaveRequest.findUnique({
      where: { id: input.requestId },
      include: { employee: true },
    });

    if (!req) throw new Error("Pengajuan cuti tidak ditemukan.");

    if (reviewerProfileId && reviewerProfileId === req.employeeId) {
      throw new Error(
        "Anda tidak dapat menyetujui atau menolak pengajuan cuti milik sendiri."
      );
    }

    if (req.status !== LeaveStatus.PENDING) {
      throw new Error("Pengajuan ini sudah diproses sebelumnya.");
    }

    if (input.decision === "APPROVED") {
      if (req.leaveType === LeaveType.ANNUAL) {
        if (req.employee.leaveQuota < req.totalDays) {
          throw new Error("Kuota cuti tahunan karyawan sudah tidak mencukupi.");
        }
        await tx.employeeProfile.update({
          where: { id: req.employeeId },
          data: { leaveQuota: { decrement: req.totalDays } },
        });
      }

      const startStr = req.startDate.toISOString().slice(0, 10);
      const endStr = req.endDate.toISOString().slice(0, 10);
      const weekdays = listWeekdaysInclusive(startStr, endStr);

      for (const dateStr of weekdays) {
        await tx.attendance.upsert({
          where: {
            employeeId_date: { employeeId: req.employeeId, date: dateStr },
          },
          update: {},
          create: {
            employeeId: req.employeeId,
            date: dateStr,
            clockIn: new Date(`${dateStr}T09:00:00+07:00`),
            status: AttendanceStatus.ON_LEAVE,
            isWfo: false,
            notes: `Cuti disetujui (${req.leaveType}): ${req.reason}`,
          },
        });
      }
    }

    const updated = await tx.leaveRequest.update({
      where: { id: req.id },
      data: {
        status: input.decision,
        reviewedByEmployeeId: reviewerProfileId ?? null,
        reviewedAt: new Date(),
        rejectionNote:
          input.decision === "REJECTED" ? input.rejectionNote!.trim() : null,
      },
    });
    return mapLeave(updated);
  });
}

export async function listLeaveRequests(
  filter?: { employeeId?: string; status?: LeaveStatus } | string
): Promise<LeaveRequestDTO[]> {
  const where =
    typeof filter === "string"
      ? { employeeId: filter }
      : {
          ...(filter?.employeeId ? { employeeId: filter.employeeId } : {}),
          ...(filter?.status ? { status: filter.status } : {}),
        };

  const rows = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { fullName: true, employeeCode: true, department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    ...mapLeave(r),
    employeeCode: r.employee.employeeCode,
    employeeName: r.employee.fullName,
    department: r.employee.department,
  }));
}

function mapLeave(r: {
  id: string;
  employeeId: string;
  reviewedByEmployeeId: string | null;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  rejectionNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}): LeaveRequestDTO {
  return {
    id: r.id,
    employeeId: r.employeeId,
    reviewedByEmployeeId: r.reviewedByEmployeeId,
    leaveType: r.leaveType,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    totalDays: r.totalDays,
    reason: r.reason,
    status: r.status,
    rejectionNote: r.rejectionNote,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}
