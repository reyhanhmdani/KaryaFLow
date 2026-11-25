import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmploymentStatus } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { EmployeeProfileDTO, SessionUserDTO } from "@/types";

const COOKIE_NAME = "karyaflow_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET wajib dikonfigurasi (minimal 32 karakter) di environment production."
      );
    }
    return "fallback-dev-secret-min-32-chars-karyaflow";
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const keyBuf = Buffer.from(key, "hex");
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function signPayload(userId: string): string {
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");
  return `${userId}.${sig}`;
}

function verifyPayload(token: string): string | null {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;

  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");

  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return userId;
}

export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signPayload(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function clearSessionUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function mapEmployeeProfile(
  profile: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    position: string;
    status: EmploymentStatus;
    joinedAt: Date;
    resignedAt: Date | null;
    avatarUrl: string | null;
    baseSalary: unknown;
    fixedAllowance: unknown;
    leaveQuota: number;
  } | null
): EmployeeProfileDTO | null {
  if (!profile) return null;
  return {
    id: profile.id,
    employeeCode: profile.employeeCode,
    fullName: profile.fullName,
    department: profile.department,
    position: profile.position,
    status: profile.status,
    joinedAt: profile.joinedAt.toISOString(),
    resignedAt: profile.resignedAt ? profile.resignedAt.toISOString() : null,
    avatarUrl: profile.avatarUrl,
    baseSalary: Number(profile.baseSalary),
    fixedAllowance: Number(profile.fixedAllowance),
    leaveQuota: profile.leaveQuota,
  };
}

export async function getCurrentUser(): Promise<SessionUserDTO | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const verifiedId = raw ? verifyPayload(raw) : null;
  if (!verifiedId) return null;

  const user = await prisma.user.findUnique({
    where: { id: verifiedId },
    include: { employeeProfile: true },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeProfile: mapEmployeeProfile(user.employeeProfile),
  };
}

export async function requireUser(): Promise<SessionUserDTO> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireEmployeeProfile(): Promise<{
  user: SessionUserDTO;
  profile: EmployeeProfileDTO;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Silakan login terlebih dahulu.");
  }
  if (!user.employeeProfile || user.employeeProfile.status === "RESIGNED") {
    throw new Error("Akun ini tidak memiliki profil karyawan aktif.");
  }
  return { user, profile: user.employeeProfile };
}

export async function requireHrAdmin(): Promise<SessionUserDTO> {
  const user = await getCurrentUser();
  if (!user || user.role !== "HR_ADMIN") {
    throw new Error(
      "Akses ditolak. Role Anda bersifat read-only atau tidak memiliki hak mutasi HR."
    );
  }
  return user;
}

export async function requireExecutiveOrHr(): Promise<SessionUserDTO> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "EXECUTIVE" && user.role !== "HR_ADMIN")) {
    throw new Error(
      "Akses ditolak. Hanya Executive atau HR Admin yang dapat mengakses data ini."
    );
  }
  return user;
}
