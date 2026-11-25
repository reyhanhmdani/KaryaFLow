import "dotenv/config";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  EmploymentStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  PayrollStatus,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding KaryaFlow database (User + EmployeeProfile + EXECUTIVE)...");

  const defaultPasswordHash = hashPassword("password123");

  // 1. Office Configuration (DumbWays Indonesia - Depok)
  await prisma.officeConfig.upsert({
    where: { id: "default" },
    update: {
      officeName: "DumbWays Indonesia (Depok)",
      officeLat: -6.381791,
      officeLng: 106.750271,
      maxRadiusMeters: 100,
      workStartTime: "09:00",
    },
    create: {
      id: "default",
      officeName: "DumbWays Indonesia (Depok)",
      officeLat: -6.381791,
      officeLng: 106.750271,
      maxRadiusMeters: 100,
      workStartTime: "09:00",
    },
  });

  // 2. Demo Accounts (Password: password123)
  // 2a. Budi Santoso (EMPLOYEE + EmployeeProfile)
  const budiUser = await prisma.user.upsert({
    where: { email: "budi@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.EMPLOYEE, isActive: true },
    create: {
      email: "budi@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });
  const budi = await prisma.employeeProfile.upsert({
    where: { userId: budiUser.id },
    update: {},
    create: {
      userId: budiUser.id,
      employeeCode: "KF-2026-001",
      fullName: "Budi Santoso",
      department: "Product Engineering",
      position: "Fullstack Developer",
      status: EmploymentStatus.ACTIVE,
      baseSalary: 12000000,
      fixedAllowance: 1500000,
      leaveQuota: 10,
    },
  });

  // 2b. Siti Rahmawati (HR_ADMIN + EmployeeProfile — HR yang juga absen & diawasi)
  const sitiUser = await prisma.user.upsert({
    where: { email: "siti@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.HR_ADMIN, isActive: true },
    create: {
      email: "siti@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.HR_ADMIN,
      isActive: true,
    },
  });
  const siti = await prisma.employeeProfile.upsert({
    where: { userId: sitiUser.id },
    update: {},
    create: {
      userId: sitiUser.id,
      employeeCode: "KF-2026-002",
      fullName: "Siti Rahmawati",
      department: "Human Resources",
      position: "HR Manager",
      status: EmploymentStatus.ACTIVE,
      baseSalary: 15000000,
      fixedAllowance: 2000000,
      leaveQuota: 12,
    },
  });

  // 2c. Admin Sistem (HR_ADMIN tanpa EmployeeProfile)
  await prisma.user.upsert({
    where: { email: "admin@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.HR_ADMIN, isActive: true },
    create: {
      email: "admin@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.HR_ADMIN,
      isActive: true,
    },
  });

  // 2d. Hendra Wijaya / Bos (EXECUTIVE read-only tanpa EmployeeProfile)
  await prisma.user.upsert({
    where: { email: "bos@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.EXECUTIVE, isActive: true },
    create: {
      email: "bos@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.EXECUTIVE,
      isActive: true,
    },
  });

  // 2e. Andi Pratama (EMPLOYEE + EmployeeProfile)
  const andiUser = await prisma.user.upsert({
    where: { email: "andi@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.EMPLOYEE, isActive: true },
    create: {
      email: "andi@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });
  const andi = await prisma.employeeProfile.upsert({
    where: { userId: andiUser.id },
    update: {},
    create: {
      userId: andiUser.id,
      employeeCode: "KF-2026-003",
      fullName: "Andi Pratama",
      department: "Product Design",
      position: "UI/UX Designer",
      status: EmploymentStatus.ACTIVE,
      baseSalary: 10500000,
      fixedAllowance: 1200000,
      leaveQuota: 11,
    },
  });

  // 2f. Clara Wijaya (EMPLOYEE PROBATION + EmployeeProfile)
  const claraUser = await prisma.user.upsert({
    where: { email: "clara@karyaflow.id" },
    update: { passwordHash: defaultPasswordHash, role: Role.EMPLOYEE, isActive: true },
    create: {
      email: "clara@karyaflow.id",
      passwordHash: defaultPasswordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });
  const clara = await prisma.employeeProfile.upsert({
    where: { userId: claraUser.id },
    update: {},
    create: {
      userId: claraUser.id,
      employeeCode: "KF-2026-004",
      fullName: "Clara Wijaya",
      department: "Growth & Marketing",
      position: "Product Marketing Specialist",
      status: EmploymentStatus.PROBATION,
      baseSalary: 9500000,
      fixedAllowance: 1000000,
      leaveQuota: 12,
    },
  });

  // 3. Sample Attendances (November 2026) — Budi, Siti (HR), Andi, Clara
  const budiDates = [
    {
      date: "2026-11-02",
      inTime: "08:48:00+07:00",
      outTime: "17:15:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 18,
    },
    {
      date: "2026-11-03",
      inTime: "08:55:00+07:00",
      outTime: "17:05:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 24,
    },
    {
      date: "2026-11-04",
      inTime: "09:14:00+07:00",
      outTime: "17:30:00+07:00",
      status: AttendanceStatus.LATE,
      late: 14,
      wfo: true,
      dist: 31,
    },
    {
      date: "2026-11-05",
      inTime: "08:52:00+07:00",
      outTime: "17:10:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: false,
      dist: 3420,
      notes: "WFH - Deep work sprint API",
    },
    {
      date: "2026-11-06",
      inTime: "08:45:00+07:00",
      outTime: "17:02:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 15,
    },
    {
      date: "2026-11-09",
      inTime: "08:59:00+07:00",
      outTime: "17:20:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 22,
    },
    {
      date: "2026-11-10",
      inTime: "09:22:00+07:00",
      outTime: "17:40:00+07:00",
      status: AttendanceStatus.LATE,
      late: 22,
      wfo: true,
      dist: 45,
    },
    {
      date: "2026-11-11",
      inTime: "08:50:00+07:00",
      outTime: "17:12:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 19,
    },
    {
      date: "2026-11-12",
      inTime: "08:47:00+07:00",
      outTime: "17:08:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: false,
      dist: 2890,
      notes: "WFH - Maintenance database",
    },
    {
      date: "2026-11-13",
      inTime: "08:54:00+07:00",
      outTime: "17:18:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 27,
    },
  ];

  for (const item of budiDates) {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: budi.id, date: item.date } },
      update: {},
      create: {
        employeeId: budi.id,
        date: item.date,
        clockIn: new Date(`${item.date}T${item.inTime}`),
        clockOut: new Date(`${item.date}T${item.outTime}`),
        clockInLat: item.wfo ? -6.38189 : -6.365,
        clockInLng: item.wfo ? 106.75035 : 106.785,
        distanceMeter: item.dist,
        status: item.status,
        lateMinutes: item.late,
        isWfo: item.wfo,
        notes: item.notes ?? null,
      },
    });
  }

  // Siti Rahmawati (HR Manager) attendances — diawasi oleh Bos (EXECUTIVE)
  const sitiDates = [
    {
      date: "2026-11-02",
      inTime: "08:42:00+07:00",
      outTime: "17:10:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 12,
    },
    {
      date: "2026-11-03",
      inTime: "08:50:00+07:00",
      outTime: "17:15:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 16,
    },
    {
      date: "2026-11-04",
      inTime: "08:56:00+07:00",
      outTime: "17:20:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 20,
    },
    {
      date: "2026-11-05",
      inTime: "09:11:00+07:00",
      outTime: "17:30:00+07:00",
      status: AttendanceStatus.LATE,
      late: 11,
      wfo: true,
      dist: 28,
    },
    {
      date: "2026-11-06",
      inTime: "08:49:00+07:00",
      outTime: "17:05:00+07:00",
      status: AttendanceStatus.PRESENT,
      late: 0,
      wfo: true,
      dist: 14,
    },
  ];

  for (const item of sitiDates) {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: siti.id, date: item.date } },
      update: {},
      create: {
        employeeId: siti.id,
        date: item.date,
        clockIn: new Date(`${item.date}T${item.inTime}`),
        clockOut: new Date(`${item.date}T${item.outTime}`),
        clockInLat: -6.38185,
        clockInLng: 106.75031,
        distanceMeter: item.dist,
        status: item.status,
        lateMinutes: item.late,
        isWfo: item.wfo,
      },
    });
  }

  // Andi & Clara sample attendances
  for (const [profile, dates] of [
    [andi, ["2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06"]],
    [clara, ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-06"]],
  ] as const) {
    for (const dateStr of dates) {
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: profile.id, date: dateStr } },
        update: {},
        create: {
          employeeId: profile.id,
          date: dateStr,
          clockIn: new Date(`${dateStr}T08:52:00+07:00`),
          clockOut: new Date(`${dateStr}T17:12:00+07:00`),
          clockInLat: -6.38189,
          clockInLng: 106.75035,
          distanceMeter: 19,
          status: AttendanceStatus.PRESENT,
          lateMinutes: 0,
          isWfo: true,
        },
      });
    }
  }

  // 4. Sample Leave Requests
  const existingLeaves = await prisma.leaveRequest.count({
    where: { employeeId: budi.id },
  });
  if (existingLeaves === 0) {
    await prisma.leaveRequest.createMany({
      data: [
        {
          employeeId: budi.id,
          reviewedByEmployeeId: siti.id,
          leaveType: LeaveType.ANNUAL,
          startDate: new Date("2026-10-15"),
          endDate: new Date("2026-10-16"),
          totalDays: 2,
          reason: "Acara keluarga di luar kota",
          status: LeaveStatus.APPROVED,
          reviewedAt: new Date("2026-10-12T10:00:00+07:00"),
        },
        {
          employeeId: budi.id,
          leaveType: LeaveType.ANNUAL,
          startDate: new Date("2026-11-26"),
          endDate: new Date("2026-11-27"),
          totalDays: 2,
          reason: "Istirahat akhir bulan & keperluan pribadi",
          status: LeaveStatus.PENDING,
        },
        {
          employeeId: andi.id,
          reviewedByEmployeeId: siti.id,
          leaveType: LeaveType.SPECIAL,
          startDate: new Date("2026-11-04"),
          endDate: new Date("2026-11-04"),
          totalDays: 1,
          reason: "Pengurusan dokumen perbankan",
          status: LeaveStatus.REJECTED,
          rejectionNote: "Jadwal bentrok dengan design handoff sprint utama.",
          reviewedAt: new Date("2026-11-03T15:30:00+07:00"),
        },
      ],
    });
  }

  // 5. Sample Payrolls (Oktober PAID & November DRAFT/PROCESSED)
  await prisma.payroll.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: budi.id,
        periodMonth: 10,
        periodYear: 2026,
      },
    },
    update: {},
    create: {
      employeeId: budi.id,
      periodMonth: 10,
      periodYear: 2026,
      baseSalary: 12000000,
      allowances: 1500000,
      lateCount: 1,
      lateDeduction: 25000,
      unpaidLeaveDays: 0,
      unpaidLeaveDeduction: 0,
      taxBpjsDeduction: 600000,
      netSalary: 12875000,
      status: PayrollStatus.PAID,
      paidAt: new Date("2026-10-28T14:00:00+07:00"),
    },
  });

  await prisma.payroll.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: budi.id,
        periodMonth: 11,
        periodYear: 2026,
      },
    },
    update: {},
    create: {
      employeeId: budi.id,
      periodMonth: 11,
      periodYear: 2026,
      baseSalary: 12000000,
      allowances: 1500000,
      lateCount: 2,
      lateDeduction: 50000,
      unpaidLeaveDays: 0,
      unpaidLeaveDeduction: 0,
      taxBpjsDeduction: 600000,
      netSalary: 12850000,
      status: PayrollStatus.DRAFT,
    },
  });

  await prisma.payroll.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: siti.id,
        periodMonth: 11,
        periodYear: 2026,
      },
    },
    update: {},
    create: {
      employeeId: siti.id,
      periodMonth: 11,
      periodYear: 2026,
      baseSalary: 15000000,
      allowances: 2000000,
      lateCount: 1,
      lateDeduction: 25000,
      unpaidLeaveDays: 0,
      unpaidLeaveDeduction: 0,
      taxBpjsDeduction: 750000,
      netSalary: 16225000,
      status: PayrollStatus.PROCESSED,
    },
  });

  // 6. Sample Performance Scorecards
  await prisma.performance.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: budi.id,
        periodMonth: 11,
        periodYear: 2026,
      },
    },
    update: {},
    create: {
      employeeId: budi.id,
      periodMonth: 11,
      periodYear: 2026,
      attendanceRate: 100.0,
      punctualityRate: 80.0,
      taskCompletionRate: 94.0,
      managerNotes:
        "Eksekusi modul API dan integrasi frontend berjalan sangat rapi serta tepat waktu. Perlu sedikit perbaikan pada ketepatan jam masuk pagi di minggu pertama.",
    },
  });

  await prisma.performance.upsert({
    where: {
      employeeId_periodMonth_periodYear: {
        employeeId: siti.id,
        periodMonth: 11,
        periodYear: 2026,
      },
    },
    update: {},
    create: {
      employeeId: siti.id,
      periodMonth: 11,
      periodYear: 2026,
      attendanceRate: 100.0,
      punctualityRate: 80.0,
      taskCompletionRate: 92.0,
      managerNotes:
        "Proses verifikasi cuti dan rekap payroll bulanan berjalan tepat jadwal.",
    },
  });

  console.log(
    "Seed selesai! Demo: budi@karyaflow.id, siti@karyaflow.id, admin@karyaflow.id, bos@karyaflow.id (password: password123)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
