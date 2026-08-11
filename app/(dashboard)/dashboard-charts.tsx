"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

function currencyTooltip(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  return `Rs. ${Number.isFinite(n) ? n.toLocaleString() : 0}`;
}

// ---- Fees: collected vs pending, last 6 months ---------------------------

export function FeesTrendChart({ data }: { data: { month: string; collected: number; pending: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip formatter={(v) => currencyTooltip(v)} />
        <Legend />
        <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" name="Pending" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Expenses by category, current month ---------------------------------

export function ExpenseCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No expenses recorded this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => currencyTooltip(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---- Net cash flow (fees collected − expenses), last 6 months ------------

export function NetCashFlowChart({ data }: { data: { month: string; collected: number; expenses: number; net: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip formatter={(v) => currencyTooltip(v)} />
        <Legend />
        <Line type="monotone" dataKey="collected" name="Fees Collected" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="net" name="Net" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}