"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Receipt,
  TrendingUp,
  Building2,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SessionUserDTO } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { logoutAction } from "@/actions/auth.actions";

interface SidebarProps {
  user: SessionUserDTO;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  };

  const navItems = [
    {
      label: "Overview",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      label: "Presensi",
      href: "/presensi",
      icon: Clock,
      active: pathname.startsWith("/presensi"),
    },
    {
      label: "Cuti & Izin",
      href: "/cuti",
      icon: CalendarDays,
      active: pathname.startsWith("/cuti"),
    },
    {
      label: "Slip Gaji",
      href: "/payroll",
      icon: Receipt,
      active: pathname.startsWith("/payroll"),
    },
    {
      label: "Performa KPI",
      href: "/performa",
      icon: TrendingUp,
      active: pathname.startsWith("/performa"),
    },
  ];

  if (user.role === "HR_ADMIN") {
    navItems.push({
      label: "Pengaturan Kantor",
      href: "/pengaturan",
      icon: Building2,
      active: pathname.startsWith("/pengaturan"),
    });
  }

  const displayName =
    user.employeeProfile?.fullName ??
    (user.role === "EXECUTIVE"
      ? "Hendra Wijaya"
      : user.email.split("@")[0]);

  const displaySubtitle = user.employeeProfile
    ? `${user.employeeProfile.position} · ${user.employeeProfile.employeeCode}`
    : user.role === "EXECUTIVE"
    ? "Direktur · Read-Only"
    : "Admin Sistem (Non-Staf)";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-[#FAF8F4] border-r border-[#E2DED3]">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#E2DED3]/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[#1B1C1E] flex items-center justify-center text-[#F7C331] font-display font-bold text-sm group-hover:scale-105 transition-transform duration-150">
            K
          </div>
          <span className="font-display text-[17px] font-bold tracking-tight text-[#1B1C1E]">
            Karya<span className="text-[#C88E0B]">Flow</span>
          </span>
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-[#73757D] hover:text-[#1B1C1E] rounded-lg cursor-pointer"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List with Studio Sliding Indicator */}
      <div className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-medium text-[#73757D]">
          Ruang kerja
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsMobileOpen(false)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150"
            >
              {item.active && (
                <motion.div
                  layoutId={isMobile ? "activeNavMobile" : "activeNavDesktop"}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 bg-[#1B1C1E] rounded-xl"
                />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                    item.active ? "text-[#F7C331]" : "text-[#73757D]"
                  }`}
                />
                <span
                  className={`truncate transition-colors duration-150 ${
                    item.active
                      ? "text-[#F6F4EE] font-medium"
                      : "text-[#4E5058] hover:text-[#1B1C1E]"
                  }`}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-3.5 border-t border-[#E2DED3]/80 bg-[#F3F0E8]/60">
        <div className="flex items-center gap-3 p-2.5 mb-2 rounded-xl bg-white border border-[#E2DED3]">
          <div className="w-8 h-8 rounded-lg bg-[#1B1C1E] text-[#F7C331] flex items-center justify-center font-display text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#1B1C1E] truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[#73757D] truncate">
              {displaySubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 pt-0.5">
          <StatusBadge status={user.role} size="sm" />
          <motion.button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#73757D] hover:text-rose-700 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50 disabled:opacity-50"
            title="Keluar dari akun"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Keluar</span>
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 z-30">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Hamburger Trigger */}
      <div className="md:hidden fixed top-2.5 left-3 z-40">
        <motion.button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          whileTap={{ scale: 0.95 }}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/95 backdrop-blur-md border border-[#E2DED3] text-[#1B1C1E] hover:bg-[#EDEAE1] cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Mobile Spring Drawer Backdrop & Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
