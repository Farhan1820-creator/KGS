import re
import os

filepath = "app/(dashboard)/dashboard/AdminDashboard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace("import { SchoolInfoCard } from \"./school-info-card\";", "import { SchoolInfoCard } from \"./school-info-card\";\nimport { DashboardFilter } from \"./DashboardFilter\";\nimport { MonthlyGoal } from \"./MonthlyGoal\";")

# Add monthsInRange to fee-range import
content = content.replace("lastNMonths, currentMonth as getCurrentMonth, formatMonthLabel }", "lastNMonths, currentMonth as getCurrentMonth, formatMonthLabel, monthsInRange }")
# Add dateBoundsForMonthRange to expense-range import
content = content.replace("dateBoundsForLastNMonths, dateBoundsForCurrentMonth }", "dateBoundsForLastNMonths, dateBoundsForCurrentMonth, dateBoundsForMonthRange }")

# Update props
content = content.replace("type AdminDashboardProps = {\n  name?: string | null;\n};", "type AdminDashboardProps = {\n  name?: string | null;\n  searchParams?: { filter?: string };\n};")

content = content.replace("export default async function AdminDashboard({ name }: AdminDashboardProps) {", "export default async function AdminDashboard({ name, searchParams }: AdminDashboardProps) {")

bounds_logic = """
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
"""

# Replace the initial variable declarations
content = re.sub(
    r"  const month = getCurrentMonth\(\);\n  const last6Months = lastNMonths\(6\);\n  const expenseBounds6 = dateBoundsForLastNMonths\(6\);\n  const expenseBoundsThisMonth = dateBoundsForCurrentMonth\(\);",
    bounds_logic,
    content
)

# Update the thisMonthFees and thisMonthExpenses queries to use targetMonths and targetExpenseBounds
content = content.replace("where: eq(fees.month, month), columns: { amount: true, status: true }", "where: inArray(fees.month, targetMonths), columns: { amount: true, status: true }")
content = content.replace("and(gte(expenses.date, expenseBoundsThisMonth.start), lte(expenses.date, expenseBoundsThisMonth.end))", "and(gte(expenses.date, targetExpenseBounds.start), lte(expenses.date, targetExpenseBounds.end))")

# Update StatCard labels
content = content.replace("Collected (This Month)", "Collected (${periodLabel})")
content = content.replace("Pending Fees (This Month)", "Pending Fees (${periodLabel})")
content = content.replace("Expenses (This Month)", "Expenses (${periodLabel})")
content = content.replace("Net (This Month)", "Net (${periodLabel})")

content = content.replace("label=\"Collected (${periodLabel})\"", "label={`Collected (${periodLabel})`}")
content = content.replace("label=\"Pending Fees (${periodLabel})\"", "label={`Pending Fees (${periodLabel})`}")
content = content.replace("label=\"Expenses (${periodLabel})\"", "label={`Expenses (${periodLabel})`}")
content = content.replace("label=\"Net (${periodLabel})\"", "label={`Net (${periodLabel})`}")

# Add DashboardFilter and MonthlyGoal to JSX
jsx_header = """      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Welcome{name ? `, ${name}` : ""}</h2>
        <DashboardFilter />
      </div>"""

content = content.replace("<h2 className=\"text-2xl font-semibold\">Welcome{name ? `, ${name}` : \"\"}</h2>", jsx_header)

monthly_goal_jsx = """      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={`Net (${periodLabel})`}
          value={`Rs. ${netThisMonth.toLocaleString()}`}
          icon={netThisMonth >= 0 ? TrendingUp : TrendingDown}
          gradient={netThisMonth >= 0 ? "from-emerald-500 to-emerald-700" : "from-red-500 to-red-700"}
        />
        <div className="md:col-span-2">
          <MonthlyGoal current={collectedThisMonth} target={500000 * targetMonths.length} label={periodLabel} />
        </div>
      </div>"""

# Replace the single net grid with the one containing MonthlyGoal
content = re.sub(
    r"<div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\s*<StatCard\s*label=\{`Net \(\$\{periodLabel\}\)`\}\s*value=\{`Rs\. \$\{netThisMonth\.toLocaleString\(\)\}`\}\s*icon=\{netThisMonth >= 0 \? TrendingUp : TrendingDown\}\s*gradient=\{netThisMonth >= 0 \? \"from-emerald-500 to-emerald-700\" : \"from-red-500 to-red-700\"\}\s*/>\s*</div>",
    monthly_goal_jsx,
    content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

