import os

filepath = "app/(dashboard)/dashboard/test-reports/test-reports-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

imports = "import { sendNotification } from \"@/lib/notifications\";\nimport { students } from \"@/db/schema\";\n"
content = imports + content

insertion = """
    const student = await db.query.students.findFirst({
      where: eq(students.id, data.studentId)
    });
    
    if (student) {
      await sendNotification(
        student.userId,
        "New Test Report",
        `A new test mark for ${data.title} has been added.`,
        "/dashboard"
      );
    }
    return { success: true };
"""

content = content.replace("return { success: true };", insertion, 1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

