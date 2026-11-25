import React from "react";
import { redirect } from "next/navigation";
import { MapPin, CalendarCheck, Receipt } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/modules/auth/LoginForm";
import { FadeIn } from "@/components/ui/motion-primitives";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F4EE] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Brand Panel (Asymmetric Showcase) */}
      <section className="relative lg:col-span-7 bg-[#1B1C1E] text-[#F6F4EE] bg-studio-grid p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(247, 195, 49, 0.45) 0%, transparent 70%)",
          }}
        />

        {/* Studio Mark */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7C331] flex items-center justify-center text-[#1B1C1E] font-display font-bold text-lg">
              K
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-[#F6F4EE]">
              KaryaFlow
            </span>
          </div>
          <span className="text-xs font-mono text-[#A6A8B1] border border-white/10 px-3 py-1 rounded-full">
            Portal Karyawan
          </span>
        </div>

        {/* Expressive Editorial Headline */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl space-y-5">
          <div className="w-10 h-1 bg-[#F7C331] rounded-full" />
          <h1
            className="font-display font-semibold tracking-tight text-[#F6F4EE] leading-[1.12]"
            style={{ fontSize: "clamp(1.85rem, 3.4vw, 3rem)" }}
          >
            Satu ruang kerja tenang untuk presensi, cuti, dan penggajian tim.
          </h1>
          <p className="text-sm sm:text-base text-[#B5B7BF] leading-relaxed max-w-md">
            Dirancang agar karyawan dan HR mengelola operasional harian dengan data
            akurat tanpa antarmuka yang berisik.
          </p>
        </div>

        {/* Grounded Feature Ledger */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8 border-t border-white/12">
          <div className="space-y-1.5">
            <MapPin className="w-4 h-4 text-[#F7C331]" />
            <p className="font-display text-sm font-semibold text-[#F6F4EE]">
              Geofence Presisi
            </p>
            <p className="text-xs text-[#9C9EA8] leading-relaxed">
              Validasi radius kantor dan dukungan izin WFH terintegrasi.
            </p>
          </div>
          <div className="space-y-1.5">
            <CalendarCheck className="w-4 h-4 text-[#F7C331]" />
            <p className="font-display text-sm font-semibold text-[#F6F4EE]">
              Approval Transaksional
            </p>
            <p className="text-xs text-[#9C9EA8] leading-relaxed">
              Pemotongan kuota cuti dan sinkronisasi status absensi otomatis.
            </p>
          </div>
          <div className="space-y-1.5">
            <Receipt className="w-4 h-4 text-[#F7C331]" />
            <p className="font-display text-sm font-semibold text-[#F6F4EE]">
              Slip Gaji A4
            </p>
            <p className="text-xs text-[#9C9EA8] leading-relaxed">
              Kalkulasi denda, BPJS, dan cetak PDF rapi dalam satu klik.
            </p>
          </div>
        </div>
      </section>

      {/* Right Workspace Form Surface */}
      <section className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14">
        <FadeIn duration={0.4} className="w-full max-w-md">
          <div className="bg-white border border-[#E2DED3] rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_-18px_rgba(27,28,30,0.12)]">
            <div className="mb-7 space-y-1.5">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[#1B1C1E]">
                Masuk ke ruang kerja
              </h2>
              <p className="text-xs text-[#73757D]">
                Gunakan email perusahaan Anda untuk mengakses portal KaryaFlow.
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-xs text-[#73757D] text-center font-mono">
            DumbWays Indonesia · Depok HQ
          </p>
        </FadeIn>
      </section>
    </div>
  );
}
