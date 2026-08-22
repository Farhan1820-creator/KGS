import { Target } from "lucide-react";

export function MonthlyGoal({ current, target, label }: { current: number; target: number; label: string }) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="rounded-xl shadow-md bg-card border border-muted/50 p-5 flex flex-col gap-4 h-full justify-center">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Revenue Goal ({label})</h3>
          <p className="text-xs text-muted-foreground">Target: Rs. {target.toLocaleString()}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold text-foreground">Rs. {current.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{percentage}% Achieved</p>
        </div>
      </div>
      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-in-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
