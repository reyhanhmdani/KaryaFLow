"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LeaveType } from "@/generated/prisma/client";
import { requireEmployeeProfile, requireHrAdmin } from "@/lib/auth";
import * as leaveService from "@/services/leave.service";
import { ActionResult, LeaveRequestDTO } from "@/types";

const submitLeaveSchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  reason: z.string().min(5, "Alasan minimal 5 karakter").max(500),
});

const reviewLeaveSchema = z.object({
  requestId: z.string().uuid("ID pengajuan tidak valid"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectionNote: z
    .string()
    .min(3, "Catatan penolakan minimal 3 karakter")
    .max(500)
    .optional(),
});

export async function submitLeaveAction(
  input: z.infer<typeof submitLeaveSchema>
): Promise<ActionResult<LeaveRequestDTO>> {
  try {
    const { profile } = await requireEmployeeProfile();
    const parsed = submitLeaveSchema.parse(input);
    const created = await leaveService.submitLeaveRequest(profile.id, parsed);

    revalidatePath("/");
    revalidatePath("/cuti");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal membuat pengajuan cuti.",
    };
  }
}

export async function reviewLeaveAction(
  input: z.infer<typeof reviewLeaveSchema>
): Promise<ActionResult<LeaveRequestDTO>> {
  try {
    const admin = await requireHrAdmin();
    const parsed = reviewLeaveSchema.parse(input);
    const updated = await leaveService.reviewLeaveRequest(
      admin.employeeProfile?.id ?? null,
      parsed
    );

    revalidatePath("/");
    revalidatePath("/cuti");
    revalidatePath("/presensi");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal memproses pengajuan cuti.",
    };
  }
}
