import os
filepath = "app/(dashboard)/teachers/teacher-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """export async function updateTeacher(teacherId: number, formData: unknown): Promise<TeacherUpdateActionResult> {
  const parsed = teacherUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, name, contactNumber, subjectId, teacherId: teacherCode, joinDate } = parsed.data;

  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId),
      columns: { userId: true },
    });
    if (!teacher) {
      return { success: false, errors: { root: ["Teacher not found."] } };
    }

    const userUpdate: any = { name, email, contactNumber };
    if (password && password.trim() !== "") {
      userUpdate.password = await hash(password, 10);
    }

    await db.update(users).set(userUpdate).where(eq(users.id, teacher.userId));
    await db
      .update(teachers)
      .set({ subjectId: Number(subjectId), teacherId: teacherCode, joinDate })
      .where(eq(teachers.id, teacherId));

    revalidatePath("/teachers");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err)) {
      // Need to figure out if it was email or teacherId that was duplicated.
      // Usually the DB error gives a detail string, but as a fallback:
      return { success: false, errors: { root: ["Email or Teacher ID is already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}"""

import re
content = re.sub(r"export async function updateTeacher\(.*?\)\s*:\s*Promise<TeacherUpdateActionResult> \{[\s\S]*?catch\s*\([^{]*\{\s*if\s*\(isPgUniqueViolation\([^}]*\}\s*return \{ success: false, errors: \{ root: \[\"Something went wrong. Try again.\"\] \} \};\s*\}\s*\}", replacement, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

