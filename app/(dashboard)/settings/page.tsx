import { db } from "@/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [subjectList, classList] = await Promise.all([
    db.query.subjects.findMany(),
    db.query.classes.findMany(),
  ]);

  return <SettingsClient subjects={subjectList} classes={classList} />;
}
