"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHrAdmin } from "@/lib/auth";
import * as payrollService from "@/services/payroll.service";
import { ActionResult, PayrollDTO } from "@/types";

const periodSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2100),
});

const statusSchema = z.object({
  payrollId: z.string().uuid("ID payroll tidak valid"),
  nextStatus: z.enum(["PROCESSED", "PAID"]),
});

export async function generatePayrollAction(
  input: z.infer<typeof periodSchema>
): Promise<ActionResult<PayrollDTO[]>> {
  try {
    await requireHrAdmin();
    const parsed = periodSchema.parse(input);
    const rows = await payrollService.generateMonthlyPayroll(
      parsed.periodMonth,
      parsed.periodYear
    );

    revalidatePath("/");
    revalidatePath("/payroll");
    return { success: true, data: rows };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal menghitung payroll bulanan.",
    };
  }
}

export async function advancePayrollStatusAction(
  input: z.infer<typeof statusSchema>
): Promise<ActionResult<PayrollDTO>> {
  try {
    await requireHrAdmin();
    const parsed = statusSchema.parse(input);
    const updated = await payrollService.updatePayrollStatus(
      parsed.payrollId,
      parsed.nextStatus
    );

    revalidatePath("/");
    revalidatePath("/payroll");
    revalidatePath(`/print/payroll/${parsed.payrollId}`);
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
          : "Gagal memperbarui status payroll.",
    };
  }
}
