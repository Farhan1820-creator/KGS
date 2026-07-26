import { db } from "@/db";
import { subjects } from "@/db/schema";
import { TeachersClient } from "./teachers-client";

export default async function TeachersPage() {
  const [teacherRows, subjectList] = await Promise.all([
    db.query.teachers.findMany({
      with: { user: true, subject: true },
    }),
    db.query.subjects.findMany(),
  ]);

  const data = teacherRows.map((t) => ({
    id: t.id,
    name: t.user.name,
    email: t.user.email,
    contactNumber: t.user.contactNumber,
    subjectName: t.subject?.name ?? "—",
  }));

  return <TeachersClient initialData={data} subjects={subjectList} />;
}
