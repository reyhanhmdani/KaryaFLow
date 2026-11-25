import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPayrollById } from "@/services/payroll.service";
import {
  formatIDR,
  formatSlipReference,
  formatIndonesianDate,
} from "@/lib/format";
import { PrintActionBar } from "@/components/modules/payroll/PrintActionBar";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface PrintPayrollPageProps {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default async function PrintPayrollPage({
  params,
}: PrintPayrollPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const payroll = await getPayrollById(id);
  if (!payroll) {
    notFound();
  }

  // Strict RBAC Ownership Verification: HR Admin, Executive (read-only), or the slip owner may access
  const isPrivileged = user.role === "HR_ADMIN" || user.role === "EXECUTIVE";
  const isOwner = user.employeeProfile?.id === payroll.employeeId;
  if (!isPrivileged && !isOwner) {
    redirect("/payroll");
  }

  const slipRef = formatSlipReference(
    payroll.periodYear,
    payroll.periodMonth,
    payroll.employeeCode || payroll.employeeId
  );

  const monthName = MONTH_NAMES[payroll.periodMonth] || `${payroll.periodMonth}`;
  const periodLabel = `${monthName} ${payroll.periodYear}`;

  const grossEarnings = payroll.baseSalary + payroll.allowances;
  const totalDeductions =
    payroll.lateDeduction +
    payroll.unpaidLeaveDeduction +
    payroll.taxBpjsDeduction;

  const printedDate = formatIndonesianDate(payroll.paidAt || new Date());

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white text-[#2B2D31]">
      {/* Top Action Bar (Hidden during printing) */}
      <PrintActionBar slipRef={slipRef} status={payroll.status} />

      {/* Main Sheet: A4 Portrait Simulator & Print Page */}
      <main className="py-8 px-4 sm:px-6 print:p-0 print:m-0 flex justify-center">
        <div className="w-full max-w-[210mm] min-h-[280mm] bg-white border border-[#D9DADC] print:border-none shadow-sm print:shadow-none p-8 sm:p-12 print:p-8 flex flex-col justify-between">
          <div>
            {/* Header Perusahaan Formal */}
            <div className="border-b-2 border-[#2B2D31] pb-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E2DED3] bg-[#F6F4EE] shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/karyaflow-logo.jpg"
                        alt="Logo KaryaFlow"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h1 className="text-xl font-black tracking-tight text-[#2B2D31]">
                      PT KARYA FLOW NUSANTARA
                    </h1>
                  </div>
                  <p className="text-[11px] text-[#71757E] mt-1 leading-relaxed">
                    Gedung Menara Karya, Lantai 8 · Jl. Margonda Raya No. 45, Depok, Jawa Barat 16424
                    <br />
                    NPWP: 01.345.678.9-412.000 · Telp: (021) 7788-9900 · info@karyaflow.id
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-2.5 py-1 bg-zinc-100 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#2B2D31]">
                    CONFIDENTIAL PAYSLIP
                  </span>
                  <div className="text-xs font-mono font-bold text-[#2B2D31] mt-1">
                    {slipRef}
                  </div>
                  <div className="text-[11px] text-[#71757E] font-medium">
                    Periode: {periodLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Identitas Karyawan (2 Kolom) */}
            <div className="bg-zinc-50 border border-[#D9DADC] rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71757E] block">
                    Nama Karyawan
                  </span>
                  <span className="font-bold text-[#2B2D31] text-sm">
                    {payroll.employeeName || user.employeeProfile?.fullName || "Karyawan"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71757E] block">
                    NIP / Kode Karyawan
                  </span>
                  <span className="font-mono text-[#2B2D31]">
                    {payroll.employeeCode || payroll.employeeId.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71757E] block">
                    Jabatan / Dept
                  </span>
                  <span className="font-medium text-[#2B2D31]">
                    {payroll.position || "Staff"} · {payroll.department || "General"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71757E] block">
                    Status Pembayaran
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{payroll.status === "PAID" ? "TELAH DICAIRKAN" : payroll.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Komponen Dua Kolom: Penerimaan vs Potongan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Kolom Kiri: Penerimaan (Earnings) */}
              <div className="border border-[#D9DADC] rounded-xl overflow-hidden">
                <div className="bg-zinc-100/80 px-4 py-2 border-b border-[#D9DADC] flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B2D31]">
                    A. Penerimaan (Earnings)
                  </span>
                  <span className="text-[10px] text-[#71757E]">Mata Uang (IDR)</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#2B2D31]">Gaji Pokok (Base Salary)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#2B2D31]">
                      {formatIDR(payroll.baseSalary)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#2B2D31]">Tunjangan Tetap / Jabatan</span>
                    <span className="font-mono font-semibold tabular-nums text-[#2B2D31]">
                      {formatIDR(payroll.allowances)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#D9DADC] flex items-center justify-between font-bold text-sm text-[#2B2D31]">
                    <span>Total Penerimaan Kotor (A)</span>
                    <span className="font-mono tabular-nums">
                      {formatIDR(grossEarnings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Potongan (Deductions) */}
              <div className="border border-[#D9DADC] rounded-xl overflow-hidden">
                <div className="bg-zinc-100/80 px-4 py-2 border-b border-[#D9DADC] flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B2D31]">
                    B. Potongan (Deductions)
                  </span>
                  <span className="text-[10px] text-[#71757E]">Mata Uang (IDR)</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#2B2D31]">
                      Keterlambatan ({payroll.lateCount}x @ Rp 25.000)
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-rose-700">
                      -{formatIDR(payroll.lateDeduction)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#2B2D31]">
                      Cuti Tanpa Upah / Unpaid ({payroll.unpaidLeaveDays} hari)
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-rose-700">
                      -{formatIDR(payroll.unpaidLeaveDeduction)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#2B2D31]">Iuran BPJS Ketenagakerjaan & Kes (5%)</span>
                    <span className="font-mono font-semibold tabular-nums text-rose-700">
                      -{formatIDR(payroll.taxBpjsDeduction)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#D9DADC] flex items-center justify-between font-bold text-sm text-rose-800">
                    <span>Total Potongan (B)</span>
                    <span className="font-mono tabular-nums">
                      -{formatIDR(totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kotak Take-Home Pay (Besar & Formal Double Underline) */}
            <div className="bg-[#2B2D31] text-white rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC93C]">
                  Total Penerimaan Bersih yang Ditransfer
                </span>
                <div className="text-sm text-zinc-300 mt-0.5">
                  Gaji Bersih / Take-Home Pay = (A - B)
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-[#FFC93C] tabular-nums border-b-4 border-double border-[#FFC93C] pb-1">
                  {formatIDR(payroll.netSalary)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Ditransfer ke rekening terdaftar karyawan
                </div>
              </div>
            </div>

            {/* Catatan Audit Presensi */}
            <div className="text-[11px] text-[#71757E] bg-zinc-50 border border-[#D9DADC] rounded-lg p-3 mb-8">
              <span className="font-bold text-[#2B2D31]">Catatan Audit Presensi:</span> Slip gaji ini dihitung secara deterministik dari log presensi modul Smart Attendance (keterlambatan: {payroll.lateCount} kali) dan modul Cuti ({payroll.unpaidLeaveDays} hari cuti khusus).
            </div>
          </div>

          {/* Bagian Tanda Tangan Digital & Otorisasi Formal */}
          <div className="border-t border-[#D9DADC] pt-6">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              {/* Karyawan Penerima */}
              <div className="space-y-14">
                <div>
                  <p className="text-[11px] text-[#71757E]">Diterima Oleh Karyawan,</p>
                </div>
                <div>
                  <div className="font-bold text-[#2B2D31] underline">
                    {payroll.employeeName || user.employeeProfile?.fullName || "Karyawan"}
                  </div>
                  <p className="text-[10px] text-[#71757E]">
                    NIP: {payroll.employeeCode || payroll.employeeId.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Otorisasi HR / Finance */}
              <div className="space-y-14">
                <div>
                  <p className="text-[11px] text-[#71757E]">
                    Depok, {printedDate}
                  </p>
                  <p className="text-[11px] font-semibold text-[#2B2D31]">
                    PT KARYA FLOW NUSANTARA
                  </p>
                </div>
                <div>
                  <div className="font-bold text-[#2B2D31] underline flex items-center justify-center gap-1">
                    <span>Siti Aminah, S.Psi</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                  </div>
                  <p className="text-[10px] text-[#71757E]">
                    Head of People & Operations (HR Admin)
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Cetak & Disclaimer */}
            <div className="mt-8 pt-4 border-t border-[#D9DADC]/40 text-center text-[9px] text-[#71757E]">
              Dokumen ini diterbitkan secara otomatis dan sah melalui sistem KaryaFlow HRIS Cloud Portal. Kerahasiaan slip gaji dilindungi oleh kebijakan perusahaan.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
