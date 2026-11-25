import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";
import { test, expect, type Page } from "@playwright/test";

const E2E_LEAVE_PREFIX = "E2E ";
const E2E_TESTER_EMAIL = "e2e.tester@karyaflow.id";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function cleanupE2EData() {
  if (!process.env.DATABASE_URL) return;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Bersihkan data test user terisolasi (jika ada)
    const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [
      E2E_TESTER_EMAIL,
    ]);
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      const empRes = await pool.query(
        'SELECT id FROM "EmployeeProfile" WHERE "userId" = $1',
        [userId]
      );
      if (empRes.rows.length > 0) {
        const empId = empRes.rows[0].id;
        await pool.query('DELETE FROM "Attendance" WHERE "employeeId" = $1', [empId]);
        await pool.query('DELETE FROM "LeaveRequest" WHERE "employeeId" = $1', [empId]);
        await pool.query('DELETE FROM "Payroll" WHERE "employeeId" = $1', [empId]);
        await pool.query('DELETE FROM "Performance" WHERE "employeeId" = $1', [empId]);
        await pool.query('DELETE FROM "EmployeeProfile" WHERE id = $1', [empId]);
      }
      await pool.query('DELETE FROM "User" WHERE id = $1', [userId]);
    }

    // 2. Bersihkan cuti & presensi hasil E2E test
    await pool.query('DELETE FROM "Attendance" WHERE notes LIKE $1', [
      `%${E2E_LEAVE_PREFIX}%`,
    ]);
    await pool.query('DELETE FROM "LeaveRequest" WHERE reason LIKE $1', [
      `${E2E_LEAVE_PREFIX}%`,
    ]);

    // 3. Bersihkan payroll & performance periode dummy (Januari 2025)
    await pool.query(
      'DELETE FROM "Payroll" WHERE "periodYear" = 2025 AND "periodMonth" = 1'
    );
    await pool.query(
      'DELETE FROM "Performance" WHERE "periodYear" = 2025 AND "periodMonth" = 1'
    );
  } finally {
    await pool.end();
  }
}

async function seedIsolatedE2EEmployee() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL wajib ada untuk E2E test.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const userId = crypto.randomUUID();
  const empId = crypto.randomUUID();
  try {
    await pool.query(
      `INSERT INTO "User" (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'EMPLOYEE', true, NOW(), NOW())`,
      [userId, E2E_TESTER_EMAIL, hashPassword("password123")]
    );
    await pool.query(
      `INSERT INTO "EmployeeProfile"
       (id, "userId", "employeeCode", "fullName", department, position, status, "joinedAt", "baseSalary", "fixedAllowance", "leaveQuota", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'QA Engineering', 'E2E Tester', 'ACTIVE', NOW(), 8000000, 1000000, 12, NOW(), NOW())`,
      [empId, userId, "KF-E2E-999", "E2E Tester"]
    );
  } finally {
    await pool.end();
  }
}

async function loginWithDemoRole(page: Page, roleButtonName: string) {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Masuk ke ruang kerja" })
  ).toBeVisible();

  await page.getByRole("button", { name: roleButtonName }).click();
  await page.getByRole("button", { name: "Masuk ke workspace" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("KaryaFlow Complete E2E Suite (12 Scenarios)", () => {
  test.beforeEach(async () => {
    await cleanupE2EData();
  });

  test.afterAll(async () => {
    await cleanupE2EData();
  });

  test("1. Auth guard redirect & penolakan kredensial salah", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email karyawan").fill("budi@karyaflow.id");
    await page.getByLabel("Kata sandi").fill("salah-banget");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(page.getByText(/salah|tidak valid|gagal/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("2. Karyawan: Overview, simulasi GPS WFO/WFH di Presensi, dan Scorecard Performa", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Budi (Karyawan)");

    await expect(
      page.getByRole("heading", { name: /Selamat bekerja, Budi Santoso/i })
    ).toBeVisible();
    await expect(page.getByText("Status Presensi Hari Ini")).toBeVisible();
    await expect(page.getByText(/Rekap Bulan/i)).toBeVisible();

    await page.getByRole("link", { name: /Buka Terminal Presensi/i }).click();
    await expect(page).toHaveURL("/presensi");
    await expect(
      page.getByRole("heading", { name: "Terminal Presensi", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Waktu Indonesia Barat (WIB)")).toBeVisible();

    await page.getByRole("button", { name: /Luar \(~4\.2km\)/i }).click();
    await expect(page.getByText("Luar Radius (WFH)")).toBeVisible();

    await page.getByRole("button", { name: /Kantor \(~14m\)/i }).click();
    await expect(page.getByText("Dalam Radius (WFO)")).toBeVisible();

    await page.getByRole("link", { name: "Performa KPI" }).click();
    await expect(page).toHaveURL("/performa");
    await expect(page.getByText(/Ketepatan waktu/i).first()).toBeVisible();
  });

  test("3. Alur Cuti Lintas Role: Budi ajukan cuti -> Siti (HR Admin) setujui", async ({
    page,
  }) => {
    const uniqueReason = `${E2E_LEAVE_PREFIX}Approve ${Date.now()}`;

    await loginWithDemoRole(page, "Budi (Karyawan)");
    await page.getByRole("link", { name: /Kelola Pengajuan Cuti/i }).click();
    await expect(page).toHaveURL("/cuti");
    await expect(
      page.getByRole("heading", { name: "Pengajuan & Persetujuan Cuti", level: 2 })
    ).toBeVisible();

    await page.getByRole("button", { name: "Ajukan Cuti Baru" }).click();
    await expect(
      page.getByRole("heading", { name: "Form Pengajuan Cuti & Izin" })
    ).toBeVisible();

    await page.getByRole("button", { name: /Sakit/i }).click();
    await page.getByLabel("Tanggal Mulai").fill("2026-12-21");
    await page.getByLabel("Tanggal Selesai").fill("2026-12-22");
    await expect(page.getByText("2 Hari Kerja")).toBeVisible();
    await page.getByLabel("Alasan Permohonan Cuti").fill(uniqueReason);

    await page.getByRole("button", { name: "Kirim Permohonan Cuti" }).click();
    await expect(
      page.getByRole("heading", { name: "Form Pengajuan Cuti & Izin" })
    ).toBeHidden();
    await expect(page.getByText(uniqueReason).first()).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginWithDemoRole(page, "Siti (HR Admin)");
    await page.getByRole("link", { name: "Cuti & Izin" }).click();
    await expect(page).toHaveURL("/cuti");

    const targetRow = page.getByRole("row").filter({ hasText: uniqueReason });
    await expect(targetRow).toBeVisible();
    await targetRow.getByRole("button", { name: "Setujui", exact: true }).click();
    await expect(targetRow.getByText("Disetujui")).toBeVisible();
  });

  test("4. HR Admin: Payroll, Pengaturan Kantor, & Buka Slip Gaji A4", async ({
    page,
    context,
  }) => {
    await loginWithDemoRole(page, "Siti (HR Admin)");

    await page.getByRole("link", { name: "Pengaturan Kantor" }).click();
    await expect(page).toHaveURL("/pengaturan");
    await expect(
      page.getByRole("heading", { name: "Pengaturan Kantor & Geofence", level: 2 })
    ).toBeVisible();

    await page.getByRole("link", { name: "Slip Gaji" }).click();
    await expect(page).toHaveURL("/payroll");
    await expect(
      page.getByRole("heading", { name: "Slip Gaji & Payroll", level: 2 })
    ).toBeVisible();
    await expect(page.getByText("Total payroll tim")).toBeVisible();

    const firstSlipLink = page.getByRole("link", { name: /Slip A4/i }).first();
    await expect(firstSlipLink).toBeVisible();

    const [printPage] = await Promise.all([
      context.waitForEvent("page"),
      firstSlipLink.click(),
    ]);
    await expect(printPage).toHaveURL(/\/print\/payroll\//);
    await expect(
      printPage.getByRole("heading", { name: "PT KARYA FLOW NUSANTARA" })
    ).toBeVisible();
    await expect(printPage.getByText("CONFIDENTIAL PAYSLIP")).toBeVisible();
    await expect(
      printPage.getByRole("button", { name: /Cetak \/ Simpan PDF/i })
    ).toBeVisible();
    await printPage.close();
  });

  test("5. Admin (Non-Staf): bisa kelola HR & Pengaturan tanpa profil pegawai", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Admin (Non-Staf)");

    await expect(page.getByText("Admin Sistem (Non-Staf)")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pengaturan Kantor" })).toBeVisible();

    await page.getByRole("link", { name: "Pengaturan Kantor" }).click();
    await expect(page).toHaveURL("/pengaturan");
    await expect(
      page.getByRole("heading", { name: "Pengaturan Kantor & Geofence", level: 2 })
    ).toBeVisible();
  });

  test("6. Bos (Executive): mode Read-Only di seluruh halaman & blokir /pengaturan", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Bos (Executive)");

    await expect(page.getByRole("heading", { name: "Executive Oversight" })).toBeVisible();
    await expect(page.getByText(/Read-Only/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Pengaturan Kantor" })).toBeHidden();

    await page.getByRole("link", { name: "Cuti & Izin" }).click();
    await expect(page).toHaveURL("/cuti");
    await expect(page.getByRole("button", { name: "Setujui", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ajukan Cuti Baru" })).toHaveCount(0);

    await page.getByRole("link", { name: "Slip Gaji" }).click();
    await expect(page).toHaveURL("/payroll");
    await expect(
      page.getByRole("button", { name: /Kalkulasi payroll bulanan/i })
    ).toHaveCount(0);

    await page.goto("/pengaturan");
    await expect(page).toHaveURL("/");
  });

  test("7. Mobile Viewport (390x844): drawer navigasi bekerja & bebas horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginWithDemoRole(page, "Budi (Karyawan)");

    await expect(
      page.getByRole("heading", { name: /Selamat bekerja, Budi Santoso/i })
    ).toBeVisible();

    const hasNoOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(hasNoOverflow).toBe(true);

    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    await page.getByRole("link", { name: "Presensi", exact: true }).click();
    await expect(page).toHaveURL("/presensi");
    await expect(
      page.getByRole("heading", { name: "Terminal Presensi", exact: true })
    ).toBeVisible();
  });

  test("8. Tolak Cuti dengan catatan & proteksi Anti Self-Approval HR Admin", async ({
    page,
  }) => {
    const rejectReason = `${E2E_LEAVE_PREFIX}Reject ${Date.now()}`;
    const selfLeaveReason = `${E2E_LEAVE_PREFIX}SelfHR ${Date.now()}`;

    // A. Budi ajukan cuti untuk ditolak HR
    await loginWithDemoRole(page, "Budi (Karyawan)");
    await page.getByRole("link", { name: /Kelola Pengajuan Cuti/i }).click();
    await page.getByRole("button", { name: "Ajukan Cuti Baru" }).click();
    await page.getByRole("button", { name: /Sakit/i }).click();
    await page.getByLabel("Tanggal Mulai").fill("2026-12-23");
    await page.getByLabel("Tanggal Selesai").fill("2026-12-23");
    await page.getByLabel("Alasan Permohonan Cuti").fill(rejectReason);
    await page.getByRole("button", { name: "Kirim Permohonan Cuti" }).click();
    await expect(page.getByText(rejectReason).first()).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/login/);

    // B. Siti (HR Admin) ajukan cuti sendiri -> pastikan tombol Setujui/Tolak tidak ada di barisnya
    await loginWithDemoRole(page, "Siti (HR Admin)");
    await page.getByRole("link", { name: "Cuti & Izin" }).click();
    await page.getByRole("button", { name: "Ajukan Cuti Baru" }).click();
    await page.getByRole("button", { name: /Sakit/i }).click();
    await page.getByLabel("Tanggal Mulai").fill("2026-12-24");
    await page.getByLabel("Tanggal Selesai").fill("2026-12-24");
    await page.getByLabel("Alasan Permohonan Cuti").fill(selfLeaveReason);
    await page.getByRole("button", { name: "Kirim Permohonan Cuti" }).click();

    const selfRow = page.getByRole("row").filter({ hasText: selfLeaveReason });
    await expect(selfRow).toBeVisible();
    await expect(selfRow.getByRole("button", { name: "Setujui", exact: true })).toHaveCount(0);
    await expect(selfRow.getByRole("button", { name: "Tolak", exact: true })).toHaveCount(0);

    // C. Siti menolak cuti Budi dengan catatan penolakan wajib
    const budiRow = page.getByRole("row").filter({ hasText: rejectReason });
    await budiRow.getByRole("button", { name: "Tolak", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Tolak Permohonan Cuti" })
    ).toBeVisible();

    const noteText = "Bentrok jadwal deploy rilis akhir tahun";
    await page.getByLabel("Alasan Penolakan (Wajib Diisi)").fill(noteText);
    await page.getByRole("button", { name: "Konfirmasi Tolak" }).click();

    await expect(budiRow.getByText("Ditolak", { exact: true })).toBeVisible();
    await expect(budiRow.getByText(new RegExp(noteText))).toBeVisible();
  });

  test("9. Alur Penuh Payroll: Kalkulasi periode dummy -> Verifikasi -> Tandai Cair", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Siti (HR Admin)");
    await page.goto("/payroll?month=1&year=2025");
    await expect(page.getByText("Periode 1/2025")).toBeVisible();

    // Generate payroll Januari 2025
    await page.getByRole("button", { name: "Kalkulasi payroll bulanan" }).click();
    await expect(
      page.getByText(/Kalkulasi payroll periode Januari 2025 berhasil diproses/i)
    ).toBeVisible();

    const budiPayrollRow = page.getByRole("row").filter({ hasText: "Budi Santoso" });
    await expect(budiPayrollRow).toBeVisible();

    // Draft -> Diproses (Verifikasi)
    await budiPayrollRow.getByRole("button", { name: "Verifikasi" }).click();
    await expect(budiPayrollRow.getByText("Diproses")).toBeVisible();

    // Diproses -> Cair (Tandai Cair)
    await budiPayrollRow.getByRole("button", { name: "Tandai Cair" }).click();
    await expect(budiPayrollRow.getByText("Cair", { exact: true })).toBeVisible();
  });

  test("10. Evaluasi Performa KPI: HR Admin memberi skor & catatan feedback manajer", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Siti (HR Admin)");
    await page.goto("/performa?month=1&year=2025");

    const budiRow = page.getByRole("row").filter({ hasText: "Budi Santoso" });
    await expect(budiRow).toBeVisible();
    await budiRow.getByRole("button", { name: "Beri Evaluasi" }).click();

    await expect(
      page.getByRole("heading", { name: "Evaluasi KPI & Kinerja Karyawan" })
    ).toBeVisible();

    const feedback = "E2E Evaluasi: Eksekusi sprint Q1 sangat konsisten";
    await page
      .getByPlaceholder(/Tuliskan evaluasi pencapaian sprint/i)
      .fill(feedback);
    await page.getByRole("button", { name: "Simpan Evaluasi KPI" }).click();

    await expect(
      page.getByRole("heading", { name: "Evaluasi KPI & Kinerja Karyawan" })
    ).toBeHidden();
    await expect(budiRow.getByText(new RegExp(feedback))).toBeVisible();
  });

  test("11. Pengaturan Kantor: HR Admin menyimpan perubahan radius lalu reset ke HQ default", async ({
    page,
  }) => {
    await loginWithDemoRole(page, "Siti (HR Admin)");
    await page.goto("/pengaturan");

    const radiusInput = page.getByLabel("Radius Toleransi WFO (Meter)");
    await radiusInput.fill("125");
    await page.getByRole("button", { name: "Simpan Perubahan Geofence" }).click();
    await expect(
      page.getByText("Pengaturan kantor & geofence berhasil disimpan!")
    ).toBeVisible();

    // Kembalikan ke default HQ (100m) agar environment tetap standar
    await page.getByRole("button", { name: "Reset Default HQ" }).click();
    await expect(radiusInput).toHaveValue("100");
    await page.getByRole("button", { name: "Simpan Perubahan Geofence" }).click();
    await expect(
      page.getByText("Pengaturan kantor & geofence berhasil disimpan!")
    ).toBeVisible();
  });

  test("12. Presensi Nyata: validasi WFH wajib catatan -> Clock-In WFO -> Clock-Out", async ({
    page,
  }) => {
    await seedIsolatedE2EEmployee();

    await page.goto("/login");
    await page.getByLabel("Email karyawan").fill(E2E_TESTER_EMAIL);
    await page.getByLabel("Kata sandi").fill("password123");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: /Buka Terminal Presensi/i }).click();
    await expect(page).toHaveURL("/presensi");

    // 1. Uji penolakan WFH tanpa catatan
    await page.getByRole("button", { name: /Luar \(~4\.2km\)/i }).click();
    await page.getByRole("button", { name: /Clock In Sekarang \(WFH\)/i }).click();
    await expect(page.getByText(/Wajib mengisi alasan\/catatan WFH/i)).toBeVisible();

    // 2. Uji Clock-In WFO berhasil
    await page.getByRole("button", { name: /Kantor \(~14m\)/i }).click();
    await page.getByLabel(/Catatan \/ Keterangan Kehadiran/i).fill("E2E WFO Test");
    await page.getByRole("button", { name: /Clock In Sekarang \(WFO\)/i }).click();

    await expect(page.getByText("Clock In tercatat pukul:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clock Out Pulang" })).toBeVisible();

    // 3. Uji Clock-Out berhasil hingga status hari ini lengkap
    await page.getByRole("button", { name: "Clock Out Pulang" }).click();
    await expect(page.getByText("Presensi Hari Ini Telah Lengkap")).toBeVisible();
  });
});
