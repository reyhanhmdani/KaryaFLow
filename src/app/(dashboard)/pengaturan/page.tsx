import React from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOfficeConfig } from "@/services/attendance.service";
import { OfficeConfigForm } from "@/components/modules/attendance/OfficeConfigForm";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

export default async function PengaturanPage() {
  const user = await requireUser();
  if (user.role !== "HR_ADMIN") {
    redirect("/");
  }

  const config = await getOfficeConfig();

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="space-y-1 pb-4 border-b border-[#E2DED3]">
          <h2
            className="font-display font-semibold tracking-tight text-[#1B1C1E]"
            style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
          >
            Pengaturan Kantor & Geofence
          </h2>
          <p className="text-xs sm:text-sm text-[#73757D]">
            Kelola titik koordinat GPS kantor pusat, radius toleransi kehadiran WFO, dan ambang batas jam masuk kerja.
          </p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <OfficeConfigForm config={config} />
      </StaggerItem>
    </StaggerContainer>
  );
}
