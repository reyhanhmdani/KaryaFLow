"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";
import { PayrollDTO } from "@/types";
import { formatIDR } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { advancePayrollStatusAction } from "@/actions/payroll.actions";

interface PayrollTableProps {
  payrolls: PayrollDTO[];
  role: string;
}

export function PayrollTable({ payrolls, role }: PayrollTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activePayrollId, setActivePayrollId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHrAdmin = role === "HR_ADMIN";

  const handleAdvanceStatus = (
    payrollId: string,
    nextStatus: "PROCESSED" | "PAID"
  ) => {
    setActionError(null);
    setActivePayrollId(payrollId);

    startTransition(async () => {
      const res = await advancePayrollStatusAction({
        payrollId,
        nextStatus,
      });

      if (!res.success) {
        setActionError(res.error);
      } else {
        router.refresh();
      }
      setActivePayrollId(null);
    });
  };

  if (payrolls.length === 0) {
    return (
      <div className="bg-white border border-[#D9DADC] rounded-2xl p-12 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-[#71757E]">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#2B2D31]">
          Belum Ada Data Slip Gaji
        </h3>
        <p className="text-xs text-[#71757E] max-w-sm mx-auto">
          {isHrAdmin
            ? "Belum ada catatan payroll untuk periode ini. Klik tombol 'Kalkulasi Payroll Bulanan' di atas untuk memproses gaji tim."
            : "Data slip gaji Anda untuk periode ini belum diterbitkan oleh bagian HR/Finance."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white border border-[#D9DADC] rounded-2xl overflow-hidden shadow-xs">
        <div
          className="overflow-x-auto focus:outline-none"
          tabIndex={0}
          role="region"
          aria-label="Tabel Slip Gaji & Payroll"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#D9DADC] text-[#71757E] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-right">Tunjangan</th>
                <th className="py-3 px-4 text-right">Total Potongan</th>
                <th className="py-3 px-4 text-right font-bold text-[#2B2D31]">
                  Take-Home Pay
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DADC]/60">
              {payrolls.map((row) => {
                const totalDeductions =
                  row.lateDeduction +
                  row.unpaidLeaveDeduction +
                  row.taxBpjsDeduction;

                const isCurrentProcessing =
                  isPending && activePayrollId === row.id;

                return (
                  <tr
                    key={row.id}
                    className="h-[52px] hover:bg-[#FAFAFA]/80 transition-colors"
                  >
                    {/* Karyawan */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1B1C1E]">
                        {row.employeeName || "Karyawan"}
                      </div>
                      <div className="text-[11px] text-[#73757D]">
                        {row.employeeCode ? `${row.employeeCode} · ` : ""}
                        {row.position || row.department || "Staff"}
                      </div>
                    </td>

                    {/* Periode */}
                    <td className="py-3 px-4 font-mono tabular-nums text-[#71757E]">
                      {row.periodMonth}/{row.periodYear}
                    </td>

                    {/* Gaji Pokok */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#2B2D31]">
                      {formatIDR(row.baseSalary)}
                    </td>

                    {/* Tunjangan */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                      +{formatIDR(row.allowances)}
                    </td>

                    {/* Potongan */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono tabular-nums text-rose-700">
                        -{formatIDR(totalDeductions)}
                      </span>
                      <div className="text-[10px] text-[#71757E] font-mono tabular-nums">
                        {row.lateCount > 0 && `${row.lateCount}x telat · `}
                        BPJS 5%
                      </div>
                    </td>

                    {/* Take-Home Pay */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold tabular-nums text-sm text-[#2B2D31]">
                        {formatIDR(row.netSalary)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Transition Button (HR Admin Only) */}
                        {isHrAdmin && row.status === "DRAFT" && (
                          <motion.button
                            type="button"
                            onClick={() =>
                              handleAdvanceStatus(row.id, "PROCESSED")
                            }
                            disabled={isPending}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isCurrentProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>Verifikasi</span>
                          </motion.button>
                        )}

                        {isHrAdmin && row.status === "PROCESSED" && (
                          <motion.button
                            type="button"
                            onClick={() => handleAdvanceStatus(row.id, "PAID")}
                            disabled={isPending}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isCurrentProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Tandai Cair</span>
                          </motion.button>
                        )}

                        {/* Link to Digital A4 Payslip */}
                        <Link
                          href={`/print/payroll/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[#2B2D31] text-[11px] font-semibold border border-[#D9DADC] transition-all"
                        >
                          <Printer className="w-3 h-3 text-[#71757E]" />
                          <span>Slip A4</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#71757E]" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
