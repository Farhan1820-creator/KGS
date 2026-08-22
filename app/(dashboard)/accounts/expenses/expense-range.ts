// Shared helpers for the expenses page's month-range filtering. Mirrors
// app/(dashboard)/accounts/fees/fee-range.ts but expands a "YYYY-MM" from/to
// pair into full "YYYY-MM-DD" date bounds (expenses can happen any day of
// the month, unlike fees which are one record per month).

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Returns the [start, end] (inclusive) date bounds covering every day in
// months `from` through `to`. If `to` is before `from`, they're swapped.
export function dateBoundsForMonthRange(from: string, to: string): { start: string; end: string } {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);

  const fromTotal = fy * 12 + (fm - 1);
  const toTotal = ty * 12 + (tm - 1);
  const [loTotal, hiTotal] = fromTotal <= toTotal ? [fromTotal, toTotal] : [toTotal, fromTotal];

  const loYear = Math.floor(loTotal / 12);
  const loMonth = loTotal % 12;
  const hiYear = Math.floor(hiTotal / 12);
  const hiMonth = hiTotal % 12;

  const start = new Date(loYear, loMonth, 1);
  const end = new Date(hiYear, hiMonth + 1, 0); // last day of hi month

  return { start: toDateString(start), end: toDateString(end) };
}

// Used by the admin dashboard chart (unrelated to the expenses page filters,
// which now only expose an explicit from/to month range).
export function dateBoundsForLastNMonths(n: number): { start: string; end: string } {
  const now = new Date();
  const to = currentMonth();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`;
  return dateBoundsForMonthRange(from, to);
}

export function dateBoundsForCurrentMonth(): { start: string; end: string } {
  return dateBoundsForMonthRange(currentMonth(), currentMonth());
}
