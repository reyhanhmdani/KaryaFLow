"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth.actions";
import { Lock, Mail, Loader2, ArrowRight, UserCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 p-3 text-xs text-rose-800 bg-rose-50/90 border border-rose-200/80 rounded-xl"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-[#4E5058] mb-1.5"
          >
            Email karyawan
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#73757D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck="false"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@karyaflow.id"
              required
              disabled={isPending}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm text-[#1B1C1E] bg-[#FAF8F4] border border-[#E2DED3] rounded-xl focus:outline-none focus:bg-white focus:border-[#1B1C1E] focus:ring-2 focus:ring-[#1B1C1E]/10 transition-all disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-[#4E5058] mb-1.5"
          >
            Kata sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#73757D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isPending}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm text-[#1B1C1E] bg-[#FAF8F4] border border-[#E2DED3] rounded-xl focus:outline-none focus:bg-white focus:border-[#1B1C1E] focus:ring-2 focus:ring-[#1B1C1E]/10 transition-all disabled:opacity-60 font-mono"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isPending}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.15 }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F7C331] hover:bg-[#EAB31C] text-[#1B1C1E] font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#1B1C1E]" />
              <span>Memverifikasi akun...</span>
            </>
          ) : (
            <>
              <span>Masuk ke workspace</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {isDemoMode && (
        <div className="pt-5 border-t border-[#E2DED3]">
          <p className="text-xs font-medium text-[#73757D] mb-2.5">
            Akses cepat mode demo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              type="button"
              onClick={() => handleFillDemo("budi@karyaflow.id", "password123")}
              disabled={isPending}
              whileHover={{ y: -1, backgroundColor: "#EDEAE1" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium bg-[#FAF8F4] border border-[#E2DED3] rounded-xl text-[#1B1C1E] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#73757D] shrink-0" />
              <span>Budi (Karyawan)</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleFillDemo("siti@karyaflow.id", "password123")}
              disabled={isPending}
              whileHover={{ y: -1, backgroundColor: "#EDEAE1" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium bg-[#FAF8F4] border border-[#E2DED3] rounded-xl text-[#1B1C1E] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#73757D] shrink-0" />
              <span>Siti (HR Admin)</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleFillDemo("admin@karyaflow.id", "password123")}
              disabled={isPending}
              whileHover={{ y: -1, backgroundColor: "#EDEAE1" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium bg-[#FAF8F4] border border-[#E2DED3] rounded-xl text-[#1B1C1E] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#73757D] shrink-0" />
              <span>Admin (Non-Staf)</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleFillDemo("bos@karyaflow.id", "password123")}
              disabled={isPending}
              whileHover={{ y: -1, backgroundColor: "#EDEAE1" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium bg-[#1B1C1E] border border-[#1B1C1E] rounded-xl text-[#F7C331] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#F7C331] shrink-0" />
              <span>Bos (Executive)</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
