// Mirrors app/(dashboard)/accounts/fees/fee-range.ts but works with full
// "YYYY-MM-DD" dates (expenses can happen any day of the month) instead of
// "YYYY-MM" months.

export type ExpenseRange = "this_month" | "last_3" | "last_6" | "this_year";

export const expenseRangeOptions: { value: ExpenseRange; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_3", label: "Last 3 Months" },
  { value: "last_6", label: "Last 6 Months" },
  { value: "this_year", label: "This Year" },
];

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Returns the [start, end] (inclusive) date bounds for a range, anchored to today.
export function dateBoundsForRange(range: ExpenseRange): { start: string; end: string } {
  const now = new Date();
  const end = toDateString(now);

  if (range === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toDateString(start), end };
  }

  if (range === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start: toDateString(start), end };
  }

  const monthsBack = range === "last_3" ? 2 : 5; // inclusive of current month
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return { start: toDateString(start), end };
}

export function isExpenseRange(value: string | undefined): value is ExpenseRange {
  return value === "this_month" || value === "last_3" || value === "last_6" || value === "this_year";
}
