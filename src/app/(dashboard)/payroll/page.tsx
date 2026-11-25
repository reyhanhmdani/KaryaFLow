import React from "react";
import { requireUser } from "@/lib/auth";
import { listPayrolls } from "@/services/payroll.service";
import { formatIDR } from "@/lib/format";
import {
  Banknote,
  CheckCircle2,
  Clock,
  TrendingDown,
} from "lucide-react";
import { PayrollControls } from "@/components/modules/payroll/PayrollControls";
import { PayrollTable } from "@/components/modules/payroll/PayrollTable";
import { MetricRibbon } from "@/components/ui/MetricRibbon";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function PayrollPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const now = new Date();
  const currentMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const currentYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

  const isHrAdmin = user.role === "HR_ADMIN";
  const isExecutive = user.role === "EXECUTIVE";
  const canMonitorAll = isHrAdmin || isExecutive;
  const profile = user.employeeProfile;

  // HR Admin & Executive see team payroll for chosen month/year; Employee sees their own history
  const payrolls = canMonitorAll
    ? await listPayrolls({ periodMonth: currentMonth, periodYear: currentYear })
    : profile
    ? await listPayrolls({ employeeId: profile.id })
    : [];

  const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDeductions = payrolls.reduce(
    (sum, p) =>
      sum + (p.lateDeduction + p.unpaidLeaveDeduction + p.taxBpjsDeduction),
    0
  );
  const paidCount = payrolls.filter((p) => p.status === "PAID").length;
  const processedCount = payrolls.filter((p) => p.status === "PROCESSED").length;
  const draftCount = payrolls.filter((p) => p.status === "DRAFT").length;

  const latestPayroll = payrolls[0] || null;

  return (
    <StaggerContainer className="space-y-6">
      {/* Header Halaman */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-[#E2DED3]">
          <div className="space-y-1">
            <h2
              className="font-display font-semibold tracking-tight text-[#1B1C1E]"
              style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
            >
              Slip Gaji & Payroll
            </h2>
            <p className="text-xs sm:text-sm text-[#73757D]">
              {isExecutive
                ? "Audit read-only total beban gaji, potongan keterlambatan, dan status pencairan"
                : isHrAdmin
                ? "Kalkulasi gaji otomatis, potongan keterlambatan, BPJS, dan pencairan tim"
                : "Transparansi rincian penghasilan, potongan kehadiran, dan arsip slip digital"}
            </p>
          </div>
          <div className="text-xs font-mono text-[#4E5058] bg-white border border-[#E2DED3] px-3 py-1.5 rounded-full tabular-nums self-start sm:self-auto">
            Periode {currentMonth}/{currentYear}
          </div>
        </div>
      </StaggerItem>

      {/* Metric Ribbon or Employee Hero Summary */}
      {canMonitorAll ? (
        <StaggerItem>
          <MetricRibbon
            items={[
              {
                label: "Total payroll tim",
                value: formatIDR(totalNet),
                helper: `${payrolls.length} karyawan tercatat`,
                accent: "neutral",
                icon: <Banknote className="w-4 h-4" />,
              },
              {
                label: "Total potongan & BPJS",
                value: `-${formatIDR(totalDeductions)}`,
                helper: "Denda telat, unpaid leave, BPJS 5%",
                accent: "rose",
                icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
              },
              {
                label: "Telah dicairkan",
                value: `${paidCount} slip`,
                helper: "Terkunci aman & siap cetak A4",
                accent: "emerald",
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
              },
              {
                label: "Antrean verifikasi",
                value: `${draftCount + processedCount} slip`,
                helper: `${draftCount} draft · ${processedCount} diproses`,
                accent: "amber",
                icon: <Clock className="w-4 h-4 text-amber-600" />,
              },
            ]}
          />
        </StaggerItem>
      ) : (
        latestPayroll && (
          <StaggerItem>
            <div className="bg-[#1B1C1E] text-[#F6F4EE] rounded-2xl p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-xs font-medium text-[#A6A8B1]">
                    Slip gaji terakhir ({latestPayroll.periodMonth}/{latestPayroll.periodYear})
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F7C331] tracking-tight tabular-nums mt-1.5">
                    {formatIDR(latestPayroll.netSalary)}
                  </div>
                  <p className="text-xs text-[#A6A8B1] mt-1">
                    Take-home pay bersih setelah potongan BPJS dan kehadiran.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-6 text-xs">
                  <div>
                    <span className="text-[#A6A8B1]">Gaji pokok</span>
                    <p className="font-mono font-semibold tabular-nums text-[#F6F4EE] mt-0.5">
                      {formatIDR(latestPayroll.baseSalary)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#A6A8B1]">Tunjangan</span>
                    <p className="font-mono font-semibold tabular-nums text-emerald-400 mt-0.5">
                      +{formatIDR(latestPayroll.allowances)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#A6A8B1]">Potongan</span>
                    <p className="font-mono font-semibold tabular-nums text-rose-400 mt-0.5">
                      -{formatIDR(latestPayroll.lateDeduction + latestPayroll.unpaidLeaveDeduction + latestPayroll.taxBpjsDeduction)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        )
      )}

      {/* Kontrol & Filter Periode (Generate hanya muncul untuk HR_ADMIN) */}
      <StaggerItem>
        <PayrollControls
          currentMonth={currentMonth}
          currentYear={currentYear}
          role={user.role}
        />
      </StaggerItem>

      {/* Tabel Data Payroll (Mutasi status hanya untuk HR_ADMIN) */}
      <StaggerItem>
        <PayrollTable payrolls={payrolls} role={user.role} />
      </StaggerItem>
    </StaggerContainer>
  );
}
