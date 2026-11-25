const JAKARTA_TZ = "Asia/Jakarta";

/**
 * Mengembalikan tanggal hari ini dalam format "YYYY-MM-DD" terkunci zona waktu WIB.
 */
export function getJakartaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Mengembalikan komponen waktu WIB saat ini (tahun, bulan 1-12, jam, menit, detik).
 */
export function getJakartaTimeParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Menghitung jumlah hari kerja (Senin-Jumat) di antara dua tanggal inklusif (format YYYY-MM-DD).
 */
export function countWeekdaysInclusive(startStr: string, endStr: string): number {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay(); // 0 = Minggu, 6 = Sabtu
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/**
 * Mengembalikan array string "YYYY-MM-DD" untuk setiap hari kerja dalam rentang tanggal.
 */
export function listWeekdaysInclusive(startStr: string, endStr: string): string[] {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Menghitung total hari kerja efektif berjalan pada bulan & tahun tertentu.
 * Jika bulan berjalan, dihitung sampai hari ini (WIB). Jika bulan lampau, seluruh hari kerja bulan tsb.
 */
export function getEffectiveWorkingDays(year: number, month: number): number {
  const now = getJakartaTimeParts();
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastCalendarDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  let capDay = lastCalendarDay;
  if (year === now.year && month === now.month) {
    capDay = Math.min(now.day, lastCalendarDay);
  } else if (year > now.year || (year === now.year && month > now.month)) {
    return 0;
  }

  const endDay = `${year}-${String(month).padStart(2, "0")}-${String(capDay).padStart(2, "0")}`;
  return countWeekdaysInclusive(firstDay, endDay);
}