import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, students, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileClient, ProfileUserData } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = Number(session.user.id);

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser) {
    redirect("/login");
  }

  let photoUrl: string | null = dbUser.image ?? null;
  let studentInfo: ProfileUserData["studentInfo"] = null;
  let teacherInfo: ProfileUserData["teacherInfo"] = null;

  if (dbUser.role === "student") {
    const student = await db.query.students.findFirst({
      where: eq(students.userId, userId),
      with: {
        class: true,
      },
    });

    if (student) {
      if (student.photoUrl) {
        photoUrl = student.photoUrl;
      }
      studentInfo = {
        rollNumber: student.rollNumber,
        className: student.class?.name ?? null,
        section: student.class?.section ?? null,
        admissionDate: student.admissionDate,
        schoolName: student.schoolName,
      };
    }
  } else if (dbUser.role === "teacher") {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
      with: {
        subject: true,
        teacherSubjects: {
          with: {
            subject: true,
          },
        },
      },
    });

    if (teacher) {
      if (teacher.photoUrl) {
        photoUrl = teacher.photoUrl;
      }
      const subjects: string[] = [];
      if (teacher.teacherSubjects && teacher.teacherSubjects.length > 0) {
        teacher.teacherSubjects.forEach((ts) => {
          if (ts.subject?.name) subjects.push(ts.subject.name);
        });
      } else if (teacher.subject?.name) {
        subjects.push(teacher.subject.name);
      }

      teacherInfo = {
        teacherId: teacher.teacherId,
        joinDate: teacher.joinDate,
        subjects,
      };
    }
  }

  const userData: ProfileUserData = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    contactNumber: dbUser.contactNumber,
    role: dbUser.role as "admin" | "teacher" | "student" | "staff",
    photoUrl,
    createdAt: dbUser.createdAt,
    studentInfo,
    teacherInfo,
  };

  return <ProfileClient user={userData} />;
}
