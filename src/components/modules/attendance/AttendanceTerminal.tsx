"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Radio,
  FileText,
  Navigation,
  Map as MapIcon,
  ExternalLink,
  Building2,
  Home,
  Radar,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AttendanceDTO, OfficeConfigDTO, SessionUserDTO } from "@/types";
import { calculateHaversineMeters } from "@/lib/geo";
import { clockInAction, clockOutAction } from "@/actions/attendance.actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTimeWIB } from "@/lib/format";
import { GeofenceMap } from "./GeofenceMap";

interface AttendanceTerminalProps {
  config: OfficeConfigDTO;
  todayAttendance: AttendanceDTO | null;
  user: SessionUserDTO;
}

type GpsMode = "DEVICE" | "OFFICE_SIM" | "OUTSIDE_SIM";

export function AttendanceTerminal({
  config,
  todayAttendance,
}: AttendanceTerminalProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // GPS State - Default to DumbWays Depok office simulation for smooth local testing
  const [gpsMode, setGpsMode] = useState<GpsMode>(
    isDemoMode ? "OFFICE_SIM" : "DEVICE"
  );
  const [currentLat, setCurrentLat] = useState<number>(-6.381890);
  const [currentLng, setCurrentLng] = useState<number>(106.750350);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mapView, setMapView] = useState<"RADAR" | "GOOGLE_MAPS">("RADAR");

  // Derived reactive distance calculation (pure, avoids cascading renders)
  const distanceMeters = calculateHaversineMeters(
    currentLat,
    currentLng,
    config.officeLat,
    config.officeLng
  );

  // Form & Action state
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Live WIB clock ticking every 1000ms
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now)
      );
      setCurrentDate(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now)
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle GPS Mode selection
  const handleGpsModeChange = (mode: GpsMode) => {
    setGpsMode(mode);
    setErrorMsg(null);
    if (mode === "OFFICE_SIM") {
      // ~14m dari DumbWays Depok (-6.381791, 106.750271)
      setCurrentLat(-6.381890);
      setCurrentLng(106.750350);
    } else if (mode === "OUTSIDE_SIM") {
      // ~4.2km dari DumbWays Depok (arah Margonda / Cinere)
      setCurrentLat(-6.3650);
      setCurrentLng(106.7850);
    } else if (mode === "DEVICE") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentLat(pos.coords.latitude);
            setCurrentLng(pos.coords.longitude);
            setIsLocating(false);
          },
          (err) => {
            setErrorMsg(`Gagal membaca GPS perangkat: ${err.message}. Beralih ke simulasi kantor.`);
            setGpsMode("OFFICE_SIM");
            setCurrentLat(-6.381890);
            setCurrentLng(106.750350);
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setErrorMsg("Browser tidak mendukung Geolocation API.");
      }
    }
  };

  const isInsideRadius = distanceMeters <= config.maxRadiusMeters;
  const isClockInDone = !!todayAttendance;
  const isClockOutDone = !!todayAttendance?.clockOut;

  // Handle Clock In
  const handleClockIn = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi catatan jika di luar radius kantor
    if (!isInsideRadius && !notes.trim()) {
      setErrorMsg(
        `Lokasi Anda berada ${distanceMeters}m dari kantor (melebihi batas ${config.maxRadiusMeters}m). Wajib mengisi alasan/catatan WFH.`
      );
      return;
    }

    startTransition(async () => {
      const res = await clockInAction({
        lat: currentLat,
        lng: currentLng,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          `Presensi Masuk berhasil dicatat (${res.data.isWfo ? "WFO" : "WFH"}). Status: ${res.data.status}.`
        );
        router.refresh();
      }
    });
  };

  // Handle Clock Out
  const handleClockOut = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await clockOutAction({
        lat: currentLat,
        lng: currentLng,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Presensi Pulang (Clock Out) berhasil dicatat. Terima kasih!");
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white border border-[#E2DED3] rounded-2xl shadow-[0_1px_2px_rgba(27,28,30,0.03)] overflow-hidden">
      {/* Header Jam Live WIB — Warm Obsidian Studio Centerpiece */}
      <div className="p-6 sm:p-7 bg-[#1B1C1E] text-[#F6F4EE]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7C331] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F7C331]" />
              </span>
              <span className="text-xs font-medium text-[#B5B7BF]">
                Waktu Indonesia Barat (WIB)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#F6F4EE] tracking-tight tabular-nums">
              {currentTime || "09:00:00"} <span className="text-sm font-medium text-[#A6A8B1]">WIB</span>
            </div>
            <p className="text-xs text-[#9C9EA8] mt-1">{currentDate}</p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-xs text-[#A6A8B1]">
              Jadwal masuk kantor
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-semibold text-[#F7C331] tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>{config.workStartTime} WIB</span>
            </div>
            <span className="text-[11px] text-[#9C9EA8]">
              Toleransi radius: {config.maxRadiusMeters} meter
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alerts Feedback */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-start gap-2.5 p-3.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-start gap-2.5 p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS Geofence Radar Status Card */}
        <div className="p-4 rounded-xl border border-[#E2DED3] bg-[#FAF8F4] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isInsideRadius
                    ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20"
                    : "bg-amber-100 text-amber-700 ring-2 ring-amber-500/20"
                }`}
              >
                <Radio className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1B1C1E] truncate">
                  {config.officeName}
                </p>
                <p className="text-[11px] text-[#73757D] font-mono tabular-nums truncate">
                  Koordinat: {config.officeLat}, {config.officeLng}
                </p>
              </div>
            </div>

            <div className="sm:text-right pl-10 sm:pl-0">
              <div className="flex items-center sm:justify-end gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    isInsideRadius ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-xs font-bold text-[#1B1C1E]">
                  {isInsideRadius ? "Dalam Radius (WFO)" : "Luar Radius (WFH)"}
                </span>
              </div>
              <p className="text-[11px] font-mono tabular-nums text-[#73757D]">
                Jarak: {distanceMeters}m / {config.maxRadiusMeters}m
              </p>
            </div>
          </div>

          {/* Interactive Geofence Map */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-medium text-[#5C5E66] flex items-center gap-1.5">
                  <MapIcon className="w-3.5 h-3.5 text-[#1B1C1E]" />
                  <span>Peta geofence</span>
                </span>
                <div className="inline-flex items-center p-0.5 bg-[#EDEAE1] rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setMapView("RADAR")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      mapView === "RADAR"
                        ? "bg-white text-[#1B1C1E] shadow-2xs font-semibold"
                        : "text-[#5C5E66] hover:text-[#1B1C1E]"
                    }`}
                  >
                    <Radar className="w-3.5 h-3.5" />
                    <span>Radar Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapView("GOOGLE_MAPS")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      mapView === "GOOGLE_MAPS"
                        ? "bg-white text-[#1B1C1E] shadow-2xs font-semibold"
                        : "text-[#5C5E66] hover:text-[#1B1C1E]"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs text-[#5C5E66] hover:text-[#1B1C1E] font-medium underline cursor-pointer self-start sm:self-auto"
              >
                {showMap ? "Sembunyikan peta" : "Buka peta"}
              </button>
            </div>

            {showMap && (
              <div className="w-full">
                {mapView === "RADAR" ? (
                  <GeofenceMap
                    officeLat={config.officeLat}
                    officeLng={config.officeLng}
                    officeName={config.officeName}
                    maxRadiusMeters={config.maxRadiusMeters}
                    userLat={currentLat}
                    userLng={currentLng}
                    isInsideRadius={isInsideRadius}
                    distanceMeters={distanceMeters}
                  />
                ) : (
                  <div className="relative w-full rounded-xl overflow-hidden border border-[#E2DED3] shadow-xs bg-[#e5e7eb] h-[320px]">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.094593860333!2d106.7502706!3d-6.381790699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69efe74948f7c5%3A0xe29cfd4fa5b1f30!2sDumbWays%20Indonesia%20(Depok)!5e0!3m2!1sen!2sid!4v1795512783482!5m2!1sen!2sid"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Google Maps DumbWays Indonesia (Depok)"
                      className="w-full h-full block"
                    />
                    <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md border border-[#E2DED3] py-1.5 px-3 rounded-xl shadow-xs text-xs flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-[#1B1C1E]">
                        DumbWays Indonesia (Depok)
                      </span>
                      <a
                        href="https://www.google.com/maps/place/DumbWays+Indonesia+(Depok)/@-6.3817907,106.7502706,17z"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline font-mono text-[11px] border-l border-[#E2DED3] pl-2 inline-flex items-center gap-1"
                      >
                        <span>Buka di Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode Testing GPS Selector (Hanya jika mode demo aktif) */}
          {isDemoMode && (
            <div className="pt-3 border-t border-[#E2DED3]">
              <p className="text-xs font-medium text-[#5C5E66] mb-2 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#D99B06]" />
                <span>Selector GPS (Mode Demo)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleGpsModeChange("OFFICE_SIM")}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    gpsMode === "OFFICE_SIM"
                      ? "bg-[#1B1C1E] text-[#F6F4EE] border-[#1B1C1E]"
                      : "bg-white text-[#1B1C1E] border-[#E2DED3] hover:bg-[#EDEAE1]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Kantor (~14m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGpsModeChange("OUTSIDE_SIM")}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    gpsMode === "OUTSIDE_SIM"
                      ? "bg-[#1B1C1E] text-[#F6F4EE] border-[#1B1C1E]"
                      : "bg-white text-[#1B1C1E] border-[#E2DED3] hover:bg-[#EDEAE1]"
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Luar (~4.2km)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGpsModeChange("DEVICE")}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    gpsMode === "DEVICE"
                      ? "bg-[#1B1C1E] text-[#F6F4EE] border-[#1B1C1E]"
                      : "bg-white text-[#1B1C1E] border-[#E2DED3] hover:bg-[#EDEAE1]"
                  }`}
                >
                  <Radar className="w-3.5 h-3.5 shrink-0" />
                  <span>GPS Browser</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Catatan WFH (Muncul jelas jika di luar radius, atau opsional) */}
        {!isClockInDone && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="notes"
                className="text-[11px] font-bold uppercase tracking-wider text-[#71757E] flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Catatan / Keterangan Kehadiran</span>
              </label>
              {!isInsideRadius && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Wajib Diisi untuk WFH
                </span>
              )}
            </div>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                !isInsideRadius
                  ? "Tulis alasan kerja dari rumah (WFH), misal: WFH sesuai jadwal giliran sprint..."
                  : "Catatan opsional (misal: tugas di luar, meeting klien)..."
              }
              className={`w-full p-3 text-xs text-[#2B2D31] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B2D31]/10 transition-all ${
                !isInsideRadius && !notes.trim()
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-[#D9DADC] focus:border-[#2B2D31]"
              }`}
            />
          </div>
        )}

        {/* Presensi Action Buttons */}
        <div className="pt-2">
          {!isClockInDone ? (
            <motion.button
              type="button"
              onClick={handleClockIn}
              disabled={isPending}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F7C331] hover:bg-[#EAB31C] text-[#1B1C1E] font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1B1C1E]" />
                  <span>Memproses Clock-In...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-[#1B1C1E]" />
                  <span>Clock In Sekarang ({isInsideRadius ? "WFO" : "WFH"})</span>
                </>
              )}
            </motion.button>
          ) : !isClockOutDone ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Clock In tercatat pukul:</span>
                  <span className="font-mono font-bold tabular-nums">
                    {formatTimeWIB(todayAttendance.clockIn)} WIB
                  </span>
                </div>
                <StatusBadge status={todayAttendance.status} size="sm" />
              </div>

              <motion.button
                type="button"
                onClick={handleClockOut}
                disabled={isPending}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2B2D31] hover:bg-[#1E1F22] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Clock-Out...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#FFC93C]" />
                    <span>Clock Out Pulang</span>
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="p-4 bg-zinc-50 border border-[#D9DADC] rounded-xl text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Presensi Hari Ini Telah Lengkap</span>
              </div>
              <p className="text-[11px] text-[#71757E] font-mono tabular-nums">
                Masuk: {formatTimeWIB(todayAttendance.clockIn)} WIB ·{" "}
                Pulang: {formatTimeWIB(todayAttendance.clockOut!)} WIB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
