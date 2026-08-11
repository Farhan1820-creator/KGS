import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";
import { ExpensesClient } from "./expenses-client";
import type { ExpenseRow } from "./expense-columns";
import { isExpenseRange, dateBoundsForRange, ExpenseRange } from "./expense-range";

export const dynamic = "force-dynamic";

interface ExpensesPageProps {
  searchParams: Promise<{
    range?: string;
    date?: string;
    categoryId?: string;
    subCategoryId?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const params = await searchParams;
  const range: ExpenseRange = isExpenseRange(params.range) ? params.range : "this_month";
  const date = params.date; // specific date overrides the range when set
  const { start, end } = date ? { start: date, end: date } : dateBoundsForRange(range);

  const whereClauses = [gte(expenses.date, start), lte(expenses.date, end)];
  if (params.categoryId) whereClauses.push(eq(expenses.categoryId, Number(params.categoryId)));
  if (params.subCategoryId) whereClauses.push(eq(expenses.subCategoryId, Number(params.subCategoryId)));

  const [expenseRows, categories, subCategories] = await Promise.all([
    db.query.expenses.findMany({
      where: and(...whereClauses),
      with: { category: true, subCategory: true },
      orderBy: (t, { desc }) => [desc(t.date)],
    }),
    db.query.expenseCategories.findMany(),
    db.query.expenseSubCategories.findMany(),
  ]);

  const data: ExpenseRow[] = expenseRows.map((e) => ({
    id: e.id,
    categoryId: e.categoryId,
    categoryName: e.category.name,
    subCategoryId: e.subCategoryId,
    subCategoryName: e.subCategory?.name ?? null,
    title: e.title,
    amount: e.amount,
    date: e.date,
    notes: e.notes,
  }));

  return (
    <ExpensesClient
      initialData={data}
      categories={categories}
      subCategories={subCategories}
      range={range}
      date={date}
      categoryId={params.categoryId}
      subCategoryId={params.subCategoryId}
    />
  );
}
