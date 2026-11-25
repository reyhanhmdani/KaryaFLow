"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEmployeeProfile, requireHrAdmin } from "@/lib/auth";
import * as attendanceService from "@/services/attendance.service";
import { ActionResult, AttendanceDTO, OfficeConfigDTO } from "@/types";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  notes: z.string().max(300).optional(),
});

const officeConfigSchema = z.object({
  officeName: z.string().min(2).max(100),
  officeLat: z.number().min(-90).max(90),
  officeLng: z.number().min(-180).max(180),
  maxRadiusMeters: z.number().int().min(10).max(5000),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Format jam harus HH:mm"),
});

export async function clockInAction(
  input: z.infer<typeof coordsSchema>
): Promise<ActionResult<AttendanceDTO>> {
  try {
    const { profile } = await requireEmployeeProfile();
    const parsed = coordsSchema.parse(input);
    const record = await attendanceService.clockIn(profile.id, parsed);

    revalidatePath("/");
    revalidatePath("/presensi");
    return { success: true, data: record };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal melakukan Clock-In.",
    };
  }
}

export async function clockOutAction(input: {
  lat?: number;
  lng?: number;
}): Promise<ActionResult<AttendanceDTO>> {
  try {
    const { profile } = await requireEmployeeProfile();
    const record = await attendanceService.clockOut(profile.id, input);

    revalidatePath("/");
    revalidatePath("/presensi");
    return { success: true, data: record };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal melakukan Clock-Out.",
    };
  }
}

export async function updateOfficeConfigAction(
  input: z.infer<typeof officeConfigSchema>
): Promise<ActionResult<OfficeConfigDTO>> {
  try {
    await requireHrAdmin();
    const parsed = officeConfigSchema.parse(input);
    const updated = await attendanceService.updateOfficeConfig(parsed);

    revalidatePath("/pengaturan");
    revalidatePath("/presensi");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan kantor.",
    };
  }
}
