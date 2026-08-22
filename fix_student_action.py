import os
filepath = "app/(dashboard)/students/student-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """  export async function updateStudent(studentId: number, formData: unknown): Promise<StudentUpdateActionResult> {
    const parsed = studentUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }
  
    const { email, password, name, contactNumber, classId, rollNumber, fee, admissionDate, photoUrl, schoolName } = parsed.data;
  
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });
      if (!student) return { success: false, errors: { root: ["Student not found."] } };
  
      const userUpdate: any = { name, email, contactNumber };
      if (password && password.trim() !== "") {
        userUpdate.password = await hash(password, 10);
      }

      await db.update(users).set(userUpdate).where(eq(users.id, student.userId));
      await db
        .update(students)
        .set({ classId: Number(classId), rollNumber, fee: fee ? Number(fee) : null, admissionDate, photoUrl: photoUrl || null, schoolName: schoolName || null })
        .where(eq(students.id, studentId));
  
      revalidatePath("/students");
      revalidatePath("/accounts/fees");
      return { success: true };
    } catch (err: unknown) {
      if (isPgUniqueViolation(err)) {
        return { success: false, errors: { email: ["Email already in use"] } };
      }
      return { success: false, errors: { root: ["Something went wrong. Try again."] } };
    }
  }"""

import re
content = re.sub(r"export async function updateStudent\(.*?\)\s*:\s*Promise<StudentUpdateActionResult> \{[\s\S]*?revalidatePath\(\"/accounts/fees\"\);\s*return \{ success: true \};\s*\}\s*catch[^{]*\{[\s\S]*?\}\s*\}", replacement, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

