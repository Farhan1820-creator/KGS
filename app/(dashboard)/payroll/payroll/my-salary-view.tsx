import { formatDuration, type SalaryBreakdown } from "../attendance/attendance-helpers";

interface MySalaryViewProps {
  month: string;
  salary: SalaryBreakdown;
}

function money(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

export function MySalaryView({ month, salary }: MySalaryViewProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Salary — {month}</h3>
          <span className="text-2xl font-semibold">Rs.{money(salary.totalSalary)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="font-medium">{salary.daysPresent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Half-Day</p>
            <p className="font-medium">{salary.daysHalfDay}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Leave</p>
            <p className="font-medium">{salary.daysLeave}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="font-medium">{salary.daysAbsent}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Time Worked</p>
            <p className="font-medium">{formatDuration(salary.totalSecondsWorked)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Basic (Full)</p>
            <p className="font-medium">Rs.{money(salary.basicSalary)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Earned Basic</p>
            <p className="font-medium">Rs.{money(salary.earnedBasic)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allowances</p>
            <p className="font-medium">{money(salary.allowances)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Working Days (Month)</p>
            <p className="font-medium">{salary.workingDaysInMonth}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your basic salary is calculated on a per-day basis across the month&apos;s scheduled working days.
        Each day worked or on approved leave adds your daily rate; absent days are not paid.
      </p>
    </div>
  );
}
