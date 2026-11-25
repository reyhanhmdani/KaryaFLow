"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { LeaveRequestModal } from "./LeaveRequestModal";

interface LeaveRequestTriggerProps {
  leaveQuota: number;
}

export function LeaveRequestTrigger({ leaveQuota }: LeaveRequestTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(255, 201, 60, 0.25)" }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] font-semibold text-xs transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Ajukan Cuti Baru</span>
      </motion.button>

      <LeaveRequestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        leaveQuota={leaveQuota}
      />
    </>
  );
}
