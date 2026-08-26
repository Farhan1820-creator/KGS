import { db } from "@/db";
import { fees, expenses, students, users, teachers, classes } from "@/db/schema";
import { inArray, and, gte, lte, eq, sql } from "drizzle-orm";
import { lastNMonths, currentMonth as getCurrentMonth, formatMonthLabel, monthsInRange } from "../accounts/fees/fee-range";
import { dateBoundsForLastNMonths, dateBoundsForCurrentMonth, dateBoundsForMonthRange } from "../accounts/expenses/expense-range";
import { FeesTrendChart, ExpenseCategoryChart, NetCashFlowChart } from "./dashboard-charts";
import { SchoolInfoCard } from "./school-info-card";
import { DashboardFilter } from "./DashboardFilter";
import { MonthlyGoal } from "./MonthlyGoal";
import { StatsContainer } from "./StatsContainer";
import { GraduationCap, Users, Wallet, Receipt, TrendingUp, TrendingDown } from "lucide-react";

type AdminDashboardProps = {
  name?: string | null;
  image?: string | null;
  searchParams?: { filter?: string };
};

function shortMonthLabel(month: string) {
  // "January 2026" -> "Jan"
  return formatMonthLabel(month).split(" ")[0].slice(0, 3);
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient = "from-blue-600 to-blue-800",
}: {
  label: string;
  value: string;
  icon: typeof Users;
  gradient?: string;
}) {
  return (
    <div className={`rounded-xl shadow-md border-0 p-5 flex items-start justify-between bg-gradient-to-br ${gradient} text-white`}>
      <div>
        <p className="text-[15px] lg:text-[16px] font-medium opacity-90">{label}</p>
        <p className="text-[26px] lg:text-[30px] xl:text-[32px] font-bold mt-1 tracking-tight">{value}</p>
      </div>
      <Icon className="h-6 w-6 opacity-80 mt-1" />
    </div>
  );
}

export default async function AdminDashboard({ name, image, searchParams }: AdminDashboardProps) {
  const filter = searchParams?.filter || "this-month";
  let targetMonths: string[];
  let targetExpenseBounds: { start: string; end: string };
  let periodLabel = "This Month";
  
  if (filter === "3-months") {
    targetMonths = lastNMonths(3);
    targetExpenseBounds = dateBoundsForLastNMonths(3);
    periodLabel = "Last 3 Months";
  } else if (filter === "6-months") {
    targetMonths = lastNMonths(6);
    targetExpenseBounds = dateBoundsForLastNMonths(6);
    periodLabel = "Last 6 Months";
  } else if (filter === "this-year") {
    const year = new Date().getFullYear();
    targetMonths = monthsInRange(`${year}-01`, `${year}-12`);
    targetExpenseBounds = dateBoundsForMonthRange(`${year}-01`, `${year}-12`);
    periodLabel = "This Year";
  } else {
    targetMonths = [getCurrentMonth()];
    targetExpenseBounds = dateBoundsForCurrentMonth();
    periodLabel = "This Month";
  }

  const month = getCurrentMonth(); // Still used for unpaid fees queries etc.
  const last6Months = lastNMonths(6);
  const expenseBounds6 = dateBoundsForLastNMonths(6);

  const [[studentCountResult], [teacherCountResult], [classCountResult], thisMonthFees, last6MonthsFees, thisMonthExpenses, last6MonthsExpenses, unpaidFees] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(eq(users.isActive, true), eq(students.status, "active"))),
      db.select({ count: sql<number>`count(*)` }).from(teachers),
      db.select({ count: sql<number>`count(*)` }).from(classes),
      db.query.fees.findMany({ where: inArray(fees.month, targetMonths), columns: { amount: true, status: true } }),
      db.query.fees.findMany({
        where: inArray(fees.month, last6Months),
        columns: { month: true, amount: true, status: true },
      }),
      db.query.expenses.findMany({
        where: and(gte(expenses.date, targetExpenseBounds.start), lte(expenses.date, targetExpenseBounds.end)),
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

  const studentCount = Number(studentCountResult?.count ?? 0);
  const teacherCount = Number(teacherCountResult?.count ?? 0);
  const classCount = Number(classCountResult?.count ?? 0);


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

  // -- Net cash flow, last 6 months (fees collected — expenses) --
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
      {/* Welcome Banner: Centered Image and Welcome Note */}
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20 shadow-md ring-2 ring-background"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl sm:text-3xl border-2 border-primary/20 shadow-md">
            {name ? name.charAt(0).toUpperCase() : "A"}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome{name ? `, ${name}` : ""}!
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Here is an overview of school operations &amp; finances.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <DashboardFilter />
      </div>

      <StatsContainer>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Students" value={String(studentCount)} icon={GraduationCap} gradient="from-indigo-600 to-blue-700" />
          <StatCard label="Teachers" value={String(teacherCount)} icon={Users} gradient="from-purple-600 to-indigo-700" />
          <StatCard label="Classes" value={String(classCount)} icon={Users} gradient="from-fuchsia-600 to-purple-700" />
          <StatCard label={`Collected (${periodLabel})`} value={`Rs. ${collectedThisMonth.toLocaleString()}`} icon={Wallet} gradient="from-emerald-600 to-teal-700" />
          <StatCard label={`Pending Fees (${periodLabel})`} value={`Rs. ${pendingThisMonth.toLocaleString()}`} icon={Wallet} gradient="from-amber-500 to-orange-600" />
          <StatCard label={`Expenses (${periodLabel})`} value={`Rs. ${expensesThisMonth.toLocaleString()}`} icon={Receipt} gradient="from-rose-600 to-red-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label={`Net (${periodLabel})`}
            value={`Rs. ${netThisMonth.toLocaleString()}`}
            icon={netThisMonth >= 0 ? TrendingUp : TrendingDown}
            gradient={netThisMonth >= 0 ? "from-emerald-500 to-emerald-700" : "from-red-500 to-red-700"}
          />
          <div className="md:col-span-2">
            <MonthlyGoal current={collectedThisMonth} target={500000 * targetMonths.length} label={periodLabel} />
          </div>
        </div>
      </StatsContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4">
          <h3 className="text-sm font-medium mb-2">Fees — Collected vs Pending (Last 6 Months)</h3>
          <FeesTrendChart data={feesTrendData} />
        </div>
        <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4">
          <h3 className="text-sm font-medium mb-2">Expenses by Category (This Month)</h3>
          <ExpenseCategoryChart data={expenseCategoryData} />
        </div>
      </div>

      <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4">
        <h3 className="text-sm font-medium mb-2">Net Cash Flow (Last 6 Months)</h3>
        <NetCashFlowChart data={netCashFlowData} />
      </div>

      {/* Unpaid fees this month */}
      <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4">
        <h3 className="text-sm font-medium mb-3">Top Unpaid Fees (This Month)</h3>
        {unpaidFees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unpaid fees this month 🎉</p>
        ) : (
          <div className="space-y-2">
            {unpaidFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm border-b border-muted/50 pb-2 last:border-0">
                <span>{f.student.user.name}</span>
                <span className="text-destructive font-medium">Rs. {f.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SchoolInfoCard />
    </div>
  );
}
