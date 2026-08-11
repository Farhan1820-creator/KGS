import { Wallet } from "lucide-react";

export function PayrollPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed p-10 flex flex-col items-center text-center gap-2">
      <Wallet className="h-8 w-8 text-muted-foreground" />
      <h3 className="text-sm font-medium">Payroll — Coming Next</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Salary will be generated automatically from each employee's attendance (hours worked, half-days,
        approved leave) once the Attendance module is finalized.
      </p>
    </div>
  );
}
