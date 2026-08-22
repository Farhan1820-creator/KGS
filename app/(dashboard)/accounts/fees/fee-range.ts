// Shared helpers for the fees page's month-range filtering. Used by both the
// server page (to decide which months to query) and the client (for the
// from/to month pickers).

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(month: string): { year: number; monthIndex0: number } {
  const [y, m] = month.split("-").map(Number);
  return { year: y, monthIndex0: m - 1 };
}

// Returns every "YYYY-MM" month from `from` through `to`, inclusive. If `to`
// is before `from`, they're swapped so the range is always well-formed.
export function monthsInRange(from: string, to: string): string[] {
  const start = parseMonth(from);
  const end = parseMonth(to);

  const startTotal = start.year * 12 + start.monthIndex0;
  const endTotal = end.year * 12 + end.monthIndex0;
  const [lo, hi] = startTotal <= endTotal ? [startTotal, endTotal] : [endTotal, startTotal];

  const months: string[] = [];
  for (let t = lo; t <= hi; t++) {
    const year = Math.floor(t / 12);
    const monthIndex0 = t % 12;
    months.push(`${year}-${String(monthIndex0 + 1).padStart(2, "0")}`);
  }
  return months;
}

// Used by the admin dashboard chart (unrelated to the fees page filters,
// which now only expose an explicit from/to month range).
export function lastNMonths(n: number): string[] {
  const now = new Date();
  const to = currentMonth();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`;
  return monthsInRange(from, to);
}

export type OverallFeeStatus = "paid" | "unpaid" | "pending";

// A student's overall fee standing across every month from admission to now
// (inclusive) — not just the current month. Only months that actually have a
// generated fee record are considered; months with no record yet (e.g. admin
// hasn't clicked "Generate Fees" for that month) are skipped entirely rather
// than counted as unpaid. "paid" only when every generated record is paid,
// "unpaid" when none are, "pending" for a mix. null when there's nothing to
// go on — no admission date, or no fee records generated yet at all.
export function computeOverallFeeStatus(
  admissionDate: string | null,
  feeStatusByMonth: Map<string, "paid" | "unpaid">
): OverallFeeStatus | null {
  if (!admissionDate) return null; // no admission date — can't determine the range
  if (feeStatusByMonth.size === 0) return null; // nothing generated yet

  const admissionMonth = admissionDate.slice(0, 7);
  const months = monthsInRange(admissionMonth, currentMonth());

  let paidCount = 0;
  let generatedCount = 0;
  for (const month of months) {
    const status = feeStatusByMonth.get(month);
    if (!status) continue; // not generated for this month — skip, don't count as unpaid
    generatedCount++;
    if (status === "paid") paidCount++;
  }

  if (generatedCount === 0) return null;
  if (paidCount === generatedCount) return "paid";
  if (paidCount === 0) return "unpaid";
  return "pending";
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}