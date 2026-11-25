"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHrAdmin } from "@/lib/auth";
import * as performanceService from "@/services/performance.service";
import { ActionResult, PerformanceDTO } from "@/types";

const reviewSchema = z.object({
  employeeId: z.string().uuid("ID karyawan tidak valid"),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2100),
  taskCompletionRate: z.number().min(0).max(100),
  managerNotes: z.string().max(1000).optional(),
});

export async function savePerformanceReviewAction(
  input: z.infer<typeof reviewSchema>
): Promise<ActionResult<PerformanceDTO>> {
  try {
    await requireHrAdmin();
    const parsed = reviewSchema.parse(input);
    const saved = await performanceService.upsertPerformanceReview(parsed);

    revalidatePath("/");
    revalidatePath("/performa");
    return { success: true, data: saved };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyimpan evaluasi performa.",
    };
  }
}
