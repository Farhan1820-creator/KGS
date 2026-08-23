import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const [subjectList, classList] = await Promise.all([
    db.query.subjects.findMany({ orderBy: (t, { desc }) => [desc(t.id)] }),
    db.query.classes.findMany({ orderBy: (t, { desc }) => [desc(t.id)] }),
  ]);

  return <SettingsClient subjects={subjectList} classes={classList} />;
}
