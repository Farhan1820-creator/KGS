import os

filepath = "app/(dashboard)/dashboard/notes/notes-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

imports = """import { sendNotificationToMultiple } from "@/lib/notifications";
import { students, users } from "@/db/schema";
import { and } from "drizzle-orm";
"""

content = content.replace("import { auth } from \"@/auth\";", imports + "import { auth } from \"@/auth\";")

insertion = """
  await db.insert(notes).values({
    uploadedBy: parseInt(session.user.id),
    classId: data.classId,
    subjectId: data.subjectId ?? null,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize ?? null,
  });

  const studentsInClass = await db.select({ userId: students.userId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.classId, data.classId), eq(students.status, "active"), eq(users.isActive, true)));
  
  if (studentsInClass.length > 0) {
    const userIds = studentsInClass.map(s => s.userId).filter(Boolean) as number[];
    await sendNotificationToMultiple(userIds, "New Note Added", `A new note "${data.title}" has been added.`, "/notes");
  }
"""

content = content.replace("""  await db.insert(notes).values({
    uploadedBy: parseInt(session.user.id),
    classId: data.classId,
    subjectId: data.subjectId ?? null,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize ?? null,
  });""", insertion)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

