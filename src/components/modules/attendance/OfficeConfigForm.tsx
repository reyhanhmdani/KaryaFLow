"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Navigation, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { OfficeConfigDTO } from "@/types";
import { updateOfficeConfigAction } from "@/actions/attendance.actions";

interface OfficeConfigFormProps {
  config: OfficeConfigDTO;
}

export function OfficeConfigForm({ config }: OfficeConfigFormProps) {
  const router = useRouter();
  const [officeName, setOfficeName] = useState(config.officeName);
  const [officeLat, setOfficeLat] = useState(config.officeLat.toString());
  const [officeLng, setOfficeLng] = useState(config.officeLng.toString());
  const [maxRadiusMeters, setMaxRadiusMeters] = useState(
    config.maxRadiusMeters.toString()
  );
  const [workStartTime, setWorkStartTime] = useState(config.workStartTime);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const lat = parseFloat(officeLat);
    const lng = parseFloat(officeLng);
    const radius = parseInt(maxRadiusMeters, 10);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      setErrorMsg("Latitude, Longitude, dan Radius wajib berupa angka valid.");
      return;
    }

    startTransition(async () => {
      const res = await updateOfficeConfigAction({
        officeName: officeName.trim(),
        officeLat: lat,
        officeLng: lng,
        maxRadiusMeters: radius,
        workStartTime: workStartTime.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Pengaturan kantor & geofence berhasil disimpan!");
        router.refresh();
      }
    });
  };

  const handleSetHQDefault = () => {
    setOfficeName("DumbWays Indonesia (Depok)");
    setOfficeLat("-6.381791");
    setOfficeLng("106.750271");
    setMaxRadiusMeters("100");
    setWorkStartTime("09:00");
  };

  return (
    <div className="bg-white border border-[#D9DADC] rounded-2xl shadow-xs overflow-hidden max-w-2xl">
      <div className="p-6 border-b border-[#D9DADC]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2B2D31] text-[#FFC93C] flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#2B2D31]">
              Parameter Geofence Kantor
            </h3>
            <p className="text-xs text-[#71757E]">
              Atur pusat radius presensi dan batas jam masuk karyawan
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSetHQDefault}
          className="text-xs text-[#71757E] hover:text-[#2B2D31] font-medium underline cursor-pointer"
        >
          Reset Default HQ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label
            htmlFor="officeName"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
          >
            Nama Kantor / Lokasi
          </label>
          <input
            id="officeName"
            type="text"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            required
            className="w-full p-2.5 text-xs text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="officeLat"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Latitude Pusat Kantor
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#71757E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="officeLat"
                type="number"
                step="any"
                value={officeLat}
                onChange={(e) => setOfficeLat(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="officeLng"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Longitude Pusat Kantor
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-[#71757E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="officeLng"
                type="number"
                step="any"
                value={officeLng}
                onChange={(e) => setOfficeLng(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="maxRadiusMeters"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Radius Toleransi WFO (Meter)
            </label>
            <input
              id="maxRadiusMeters"
              type="number"
              min={10}
              max={5000}
              value={maxRadiusMeters}
              onChange={(e) => setMaxRadiusMeters(e.target.value)}
              required
              className="w-full p-2.5 text-xs font-mono text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all"
            />
            <p className="text-[11px] text-[#71757E] mt-1">
              Jarak di luar batas ini wajib mengisi catatan WFH.
            </p>
          </div>

          <div>
            <label
              htmlFor="workStartTime"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#71757E] mb-1.5"
            >
              Batas Jam Masuk (HH:mm WIB)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#71757E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="workStartTime"
                type="text"
                pattern="^\d{2}:\d{2}$"
                placeholder="09:00"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono text-[#2B2D31] bg-white border border-[#D9DADC] rounded-xl focus:outline-none focus:border-[#2B2D31] focus:ring-2 focus:ring-[#2B2D31]/10 transition-all"
              />
            </div>
            <p className="text-[11px] text-[#71757E] mt-1">
              Clock-in setelah jam ini otomatis berstatus LATE (Terlambat).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#D9DADC]/60 flex items-center justify-end">
          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(255, 201, 60, 0.25)" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#2B2D31]" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Perubahan Geofence</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
