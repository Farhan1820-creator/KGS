import { db } from "@/db";
import { fees, expenses } from "@/db/schema";
import { inArray, and, gte, lte, eq } from "drizzle-orm";
import { monthsForRange, currentMonth as getCurrentMonth, formatMonthLabel } from "./accounts/fees/fee-range";
import { dateBoundsForRange } from "./accounts/expenses/expense-range";
import { FeesTrendChart, ExpenseCategoryChart, NetCashFlowChart } from "./dashboard-charts";
import { GraduationCap, Users, Wallet, Receipt, TrendingUp, TrendingDown } from "lucide-react";

type AdminDashboardProps = {
  name?: string | null;
};

function shortMonthLabel(month: string) {
  // "January 2026" -> "Jan"
  return formatMonthLabel(month).split(" ")[0].slice(0, 3);
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Users;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive" ? "text-green-600" : tone === "negative" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border p-4 flex items-start justify-between">
      <div>
        <p className=" text-[16px] lg:text-[18px] xl:text-[18px] text-muted-foreground">{label}</p>
        <p className={`text-[26px] lg:text-[30px] xl:text-[32px] font-semibold ${toneClass}`}>{value}</p>
      </div>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export default async function AdminDashboard({ name }: AdminDashboardProps) {
  const month = getCurrentMonth();
  const last6Months = monthsForRange("last_6");
  const expenseBounds6 = dateBoundsForRange("last_6");
  const expenseBoundsThisMonth = dateBoundsForRange("this_month");

  const [studentCount, teacherCount, classCount, thisMonthFees, last6MonthsFees, thisMonthExpenses, last6MonthsExpenses, unpaidFees] =
    await Promise.all([
      db.query.students.findMany({ columns: { id: true } }).then((r) => r.length),
      db.query.teachers.findMany({ columns: { id: true } }).then((r) => r.length),
      db.query.classes.findMany({ columns: { id: true } }).then((r) => r.length),
      db.query.fees.findMany({ where: eq(fees.month, month), columns: { amount: true, status: true } }),
      db.query.fees.findMany({
        where: inArray(fees.month, last6Months),
        columns: { month: true, amount: true, status: true },
      }),
      db.query.expenses.findMany({
        where: and(gte(expenses.date, expenseBoundsThisMonth.start), lte(expenses.date, expenseBoundsThisMonth.end)),
        with: { category: true },
        columns: { amount: true },
      }),
      db.query.expenses.findMany({
        where: and(gte(expenses.date, expenseBounds6.start), lte(expenses.date, expenseBounds6.end)),
        columns: { date: true, amount: true },
      }),
      db.query.fees.findMany({
        where: and(eq(fees.month, month), eq(fees.status, "unpaid")),
        with: { student: { with: { user: true } } },
        orderBy: (t, { desc }) => [desc(t.amount)],
        limit: 5,
      }),
    ]);

  // -- This month stat totals --
  const collectedThisMonth = thisMonthFees.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const pendingThisMonth = thisMonthFees.filter((f) => f.status === "unpaid").reduce((s, f) => s + f.amount, 0);
  const expensesThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const netThisMonth = collectedThisMonth - expensesThisMonth;

  // -- Fees trend, last 6 months (collected vs pending, grouped by month) --
  const feesTrendData = last6Months.map((m) => {
    const rows = last6MonthsFees.filter((f) => f.month === m);
    return {
      month: shortMonthLabel(m),
      collected: rows.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0),
      pending: rows.filter((f) => f.status === "unpaid").reduce((s, f) => s + f.amount, 0),
    };
  });

  // -- Expenses by category, this month --
  const categoryTotals = new Map<string, number>();
  for (const e of thisMonthExpenses) {
    const name = e.category.name;
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + e.amount);
  }
  const expenseCategoryData = Array.from(categoryTotals.entries()).map(([name, value]) => ({ name, value }));

  // -- Net cash flow, last 6 months (fees collected − expenses) --
  const netCashFlowData = last6Months.map((m, i) => {
    const feesForMonth = last6MonthsFees.filter((f) => f.month === m);
    const collected = feesForMonth.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);

    // approximate each month's window the same way expense-range does for a single month
    const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - (last6Months.length - 1 - i), 1);
    const monthStart = monthDate.toISOString().slice(0, 10);
    const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const monthEnd = monthEndDate.toISOString().slice(0, 10);

    const expensesForMonth = last6MonthsExpenses
      .filter((e) => e.date >= monthStart && e.date <= monthEnd)
      .reduce((s, e) => s + e.amount, 0);

    return { month: shortMonthLabel(m), collected, expenses: expensesForMonth, net: collected - expensesForMonth };
  });

  return (
    <div className="page-shell space-y-6">
      <h2 className="text-2xl font-semibold">Welcome{name ? `, ${name}` : ""}</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Students" value={String(studentCount)} icon={GraduationCap} />
        <StatCard label="Teachers" value={String(teacherCount)} icon={Users} />
        <StatCard label="Classes" value={String(classCount)} icon={Users} />
        <StatCard label="Collected (This Month)" value={`Rs. ${collectedThisMonth.toLocaleString()}`} icon={Wallet} tone="positive" />
        <StatCard label="Pending Fees (This Month)" value={`Rs. ${pendingThisMonth.toLocaleString()}`} icon={Wallet} tone="negative" />
        <StatCard label="Expenses (This Month)" value={`Rs. ${expensesThisMonth.toLocaleString()}`} icon={Receipt} tone="negative" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Net (This Month)"
          value={`Rs. ${netThisMonth.toLocaleString()}`}
          icon={netThisMonth >= 0 ? TrendingUp : TrendingDown}
          tone={netThisMonth >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">Fees — Collected vs Pending (Last 6 Months)</h3>
          <FeesTrendChart data={feesTrendData} />
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">Expenses by Category (This Month)</h3>
          <ExpenseCategoryChart data={expenseCategoryData} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-2">Net Cash Flow (Last 6 Months)</h3>
        <NetCashFlowChart data={netCashFlowData} />
      </div>

      {/* Unpaid fees this month */}
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">Top Unpaid Fees (This Month)</h3>
        {unpaidFees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unpaid fees this month 🎉</p>
        ) : (
          <div className="space-y-2">
            {unpaidFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span>{f.student.user.name}</span>
                <span className="text-destructive font-medium">Rs. {f.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
