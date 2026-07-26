import { db } from "@/db";
import { classes } from "@/db/schema";
import { StudentsClient } from "./students-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  // one query with relations instead of separate user/class round-trips (see db/queries/students.ts)
  const [studentRows, classList] = await Promise.all([
    db.query.students.findMany({
      with: { user: true, class: true },
    }),
    db.query.classes.findMany(),
  ]);

  const data = studentRows.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    contactNumber: s.user.contactNumber,
    className: s.class?.name ?? "—",
    rollNumber: s.rollNumber,
  }));

  return <StudentsClient initialData={data} classes={classList} />;
}
