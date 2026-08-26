import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { TeachersClient } from "./teachers-client";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const [teacherRows, subjectList] = await Promise.all([
    db.query.teachers.findMany({
      with: {
        user: true,
        subject: true,
        teacherSubjects: {
          with: { subject: true },
        },
      },
      orderBy: (t, { desc }) => [desc(t.id)],
    }),
    db.query.subjects.findMany({ orderBy: (t, { desc }) => [desc(t.id)] }),
  ]);

  const data = teacherRows.map((t) => {
    const assignedSubjects = t.teacherSubjects && t.teacherSubjects.length > 0
      ? t.teacherSubjects.map((ts) => ({ id: ts.subjectId, name: ts.subject.name }))
      : t.subject
      ? [{ id: t.subject.id, name: t.subject.name }]
      : [];

    const subjectNames = assignedSubjects.map((s) => s.name);
    const subjectIds = assignedSubjects.map((s) => s.id);

    return {
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      password: t.user.rawPassword ?? t.user.contactNumber ?? "",
      contactNumber: t.user.contactNumber,
      subjectIds,
      subjectNames,
      subjectName: subjectNames.length > 0 ? subjectNames.join(", ") : "—",
      teacherId: t.teacherId,
      joinDate: t.joinDate,
      photoUrl: t.photoUrl || (t.user as any).image || null,
      isActive: t.user.isActive,
    };
  });

  return <TeachersClient initialData={data} subjects={subjectList} />;
}
