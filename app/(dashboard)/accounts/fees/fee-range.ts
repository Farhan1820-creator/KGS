// Shared helpers for the fees page's range/month filtering. Used by both the
// server page (to decide which months to query) and the client (for the
// range dropdown's options/labels).

export type FeeRange = "this_month" | "last_3" | "last_6" | "this_year";

export const feeRangeOptions: { value: FeeRange; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_3", label: "Last 3 Months" },
  { value: "last_6", label: "Last 6 Months" },
  { value: "this_year", label: "This Year" },
];

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthString(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

// Returns the list of "YYYY-MM" months covered by a range, anchored to today.
export function monthsForRange(range: FeeRange): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex0 = now.getMonth(); // 0-based

  if (range === "this_month") {
    return [monthString(year, monthIndex0)];
  }

  if (range === "this_year") {
    const months: string[] = [];
    for (let m = 0; m <= monthIndex0; m++) months.push(monthString(year, m));
    return months;
  }

  const count = range === "last_3" ? 3 : 6;
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex0 - i, 1);
    months.push(monthString(d.getFullYear(), d.getMonth()));
  }
  return months;
}

export function isFeeRange(value: string | undefined): value is FeeRange {
  return value === "this_month" || value === "last_3" || value === "last_6" || value === "this_year";
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
