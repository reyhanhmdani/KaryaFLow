import {
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
  PayrollStatus,
  Role,
} from "@/generated/prisma/client";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface EmployeeProfileDTO {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  status: EmploymentStatus;
  joinedAt: string;
  resignedAt: string | null;
  avatarUrl: string | null;
  baseSalary: number;
  fixedAllowance: number;
  leaveQuota: number;
}

export interface SessionUserDTO {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employeeProfile: EmployeeProfileDTO | null;
}

export interface OfficeConfigDTO {
  id: string;
  officeName: string;
  officeLat: number;
  officeLng: number;
  maxRadiusMeters: number;
  workStartTime: string;
}

export interface AttendanceDTO {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  date: string; // "YYYY-MM-DD" WIB
  clockIn: string; // ISO string
  clockOut: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  distanceMeter: number | null;
  status: AttendanceStatus;
  lateMinutes: number;
  isWfo: boolean;
  notes: string | null;
}

export interface AttendanceSummaryDTO {
  effectiveWorkingDays: number;
  presentDays: number;
  lateDays: number;
  onLeaveDays: number;
  absentDays: number;
  todayRecord: AttendanceDTO | null;
}

export interface LeaveRequestDTO {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  reviewedByEmployeeId: string | null;
  leaveType: LeaveType;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  rejectionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface PayrollDTO {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  position?: string;
  department?: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: number;
  allowances: number;
  lateCount: number;
  lateDeduction: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  taxBpjsDeduction: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt: string | null;
}

export interface PerformanceDTO {
  id: string | null;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  position?: string;
  department?: string;
  role?: Role;
  periodMonth: number;
  periodYear: number;
  attendanceRate: number;
  punctualityRate: number;
  taskCompletionRate: number;
  managerNotes: string | null;
}

export interface ExecutiveHrAttendanceItemDTO {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  presentCount: number;
  lateCount: number;
  onLeaveCount: number;
  totalLateMinutes: number;
  recentLogs: AttendanceDTO[];
}

export interface ExecutiveOverviewDTO {
  periodMonth: number;
  periodYear: number;
  activeEmployeeCount: number;
  hrAttendanceDiscipline: ExecutiveHrAttendanceItemDTO[];
  hrOperations: {
    leavePendingCount: number;
    leaveApprovedCount: number;
    leaveRejectedCount: number;
    avgLeaveProcessingHours: number | null;
    payrollDraftCount: number;
    payrollProcessedCount: number;
    payrollPaidCount: number;
    payrollTotalNet: number;
    performanceReviewedCount: number;
    performanceCoveragePercent: number;
  };
  staffScorecards: PerformanceDTO[];
}
