// Indonesian Rupiah (IDR) currency, date & payslip number formatters
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSlipReference(
  year: number,
  month: number,
  employeeRef: string
): string {
  const ym = `${year}${String(month).padStart(2, "0")}`;
  const cleanRef = employeeRef.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `SLIP/${ym}/${cleanRef}`;
}

export function formatIndonesianDate(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
