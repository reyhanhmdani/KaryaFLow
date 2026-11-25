import { AttendanceStatus, EmploymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateHaversineMeters } from "@/lib/geo";
import {
  getEffectiveWorkingDays,
  getJakartaDateString,
  getJakartaTimeParts,
} from "@/lib/date";
import { AttendanceDTO, AttendanceSummaryDTO, OfficeConfigDTO } from "@/types";

export async function getOfficeConfig(): Promise<OfficeConfigDTO> {
  const config = await prisma.officeConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      officeName: "DumbWays Indonesia (Depok)",
      officeLat: -6.381791,
      officeLng: 106.750271,
      maxRadiusMeters: 100,
      workStartTime: "09:00",
    },
  });

  return {
    id: config.id,
    officeName: config.officeName,
    officeLat: config.officeLat,
    officeLng: config.officeLng,
    maxRadiusMeters: config.maxRadiusMeters,
    workStartTime: config.workStartTime,
  };
}

export async function updateOfficeConfig(data: {
  officeName: string;
  officeLat: number;
  officeLng: number;
  maxRadiusMeters: number;
  workStartTime: string;
}): Promise<OfficeConfigDTO> {
  const updated = await prisma.officeConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return updated;
}

export async function clockIn(
  employeeId: string,
  input: { lat: number; lng: number; notes?: string }
): Promise<AttendanceDTO> {
  const now = new Date();
  const todayStr = getJakartaDateString(now);
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: todayStr } },
  });

  if (existing) {
    throw new Error(
      "Anda sudah melakukan Clock-In atau berstatus cuti hari ini."
    );
  }

  const config = await getOfficeConfig();
  const distanceMeter = calculateHaversineMeters(
    input.lat,
    input.lng,
    config.officeLat,
    config.officeLng
  );

  const isWfo = distanceMeter <= config.maxRadiusMeters;
  if (!isWfo && (!input.notes || input.notes.trim().length < 3)) {
    throw new Error(
      `Lokasi terdeteksi ${distanceMeter}m dari kantor (di luar radius ${config.maxRadiusMeters}m). Wajib isi keterangan WFH.`
    );
  }

  const [startHour, startMin] = config.workStartTime.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMin;

  const parts = getJakartaTimeParts(now);
  const currentTotalMinutes = parts.hour * 60 + parts.minute;

  // <= 09:00:59 PRESENT; >= 09:01:00 LATE
  const isLate = currentTotalMinutes > startTotalMinutes;
  const lateMinutes = isLate ? currentTotalMinutes - startTotalMinutes : 0;

  const created = await prisma.attendance.create({
    data: {
      employeeId,
      date: todayStr,
      clockIn: now,
      clockInLat: input.lat,
      clockInLng: input.lng,
      distanceMeter,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      lateMinutes,
      isWfo,
      notes: input.notes?.trim() || null,
    },
  });

  return mapAttendance(created);
}

export async function clockOut(
  employeeId: string,
  input: { lat?: number; lng?: number }
): Promise<AttendanceDTO> {
  const now = new Date();
  const todayStr = getJakartaDateString(now);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: todayStr } },
  });

  if (!existing) {
    throw new Error("Anda belum melakukan Clock-In hari ini.");
  }
  if (existing.clockOut) {
    throw new Error("Anda sudah melakukan Clock-Out hari ini.");
  }

  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      clockOut: now,
      clockOutLat: input.lat ?? null,
      clockOutLng: input.lng ?? null,
    },
  });

  return mapAttendance(updated);
}

export async function getAttendanceSummary(
  employeeId: string,
  year: number,
  month: number
): Promise<AttendanceSummaryDTO> {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const todayStr = getJakartaDateString();

  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { startsWith: prefix },
    },
  });

  const presentDays = records.filter((r) => r.status === "PRESENT").length;
  const lateDays = records.filter((r) => r.status === "LATE").length;
  const onLeaveDays = records.filter((r) => r.status === "ON_LEAVE").length;

  const effectiveWorkingDays = getEffectiveWorkingDays(year, month);
  const accountedDays = presentDays + lateDays + onLeaveDays;
  const absentDays = Math.max(0, effectiveWorkingDays - accountedDays);

  const todayRecord = records.find((r) => r.date === todayStr) ?? null;

  return {
    effectiveWorkingDays,
    presentDays,
    lateDays,
    onLeaveDays,
    absentDays,
    todayRecord: todayRecord ? mapAttendance(todayRecord) : null,
  };
}

export async function listAttendances(filter?: {
  employeeId?: string;
  monthPrefix?: string; // "YYYY-MM"
}): Promise<AttendanceDTO[]> {
  const rows = await prisma.attendance.findMany({
    where: {
      ...(filter?.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter?.monthPrefix
        ? { date: { startsWith: filter.monthPrefix } }
        : {}),
      employee: {
        status: { not: EmploymentStatus.RESIGNED },
      },
    },
    include: {
      employee: {
        select: { fullName: true, employeeCode: true, department: true },
      },
    },
    orderBy: [{ date: "desc" }, { clockIn: "desc" }],
  });

  return rows.map((r) => ({
    ...mapAttendance(r),
    employeeCode: r.employee.employeeCode,
    employeeName: r.employee.fullName,
    department: r.employee.department,
  }));
}

export function mapAttendance(r: {
  id: string;
  employeeId: string;
  date: string;
  clockIn: Date;
  clockOut: Date | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  distanceMeter: number | null;
  status: AttendanceStatus;
  lateMinutes: number;
  isWfo: boolean;
  notes: string | null;
}): AttendanceDTO {
  return {
    id: r.id,
    employeeId: r.employeeId,
    date: r.date,
    clockIn: r.clockIn.toISOString(),
    clockOut: r.clockOut ? r.clockOut.toISOString() : null,
    clockInLat: r.clockInLat,
    clockInLng: r.clockInLng,
    clockOutLat: r.clockOutLat,
    clockOutLng: r.clockOutLng,
    distanceMeter: r.distanceMeter,
    status: r.status,
    lateMinutes: r.lateMinutes,
    isWfo: r.isWfo,
    notes: r.notes,
  };
}
