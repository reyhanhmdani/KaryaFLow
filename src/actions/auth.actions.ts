"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSessionUser,
  mapEmployeeProfile,
  setSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { ActionResult, SessionUserDTO } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult<SessionUserDTO>> {
  try {
    const { email, password } = loginSchema.parse(input);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { employeeProfile: true },
    });
    if (!user || !user.isActive) {
      return { success: false, error: "Email, password salah, atau akun nonaktif." };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Email atau password salah." };
    }

    await setSessionUser(user.id);
    revalidatePath("/", "layout");

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        employeeProfile: mapEmployeeProfile(user.employeeProfile),
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal masuk.",
    };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    await clearSessionUser();
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal keluar.",
    };
  }
}
