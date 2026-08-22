import os
filepath = "app/(dashboard)/teachers/teacher-validation.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
"""export const teacherUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),""",
"""export const teacherUpdateSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  name: z.string().min(2, "Name must be at least 2 characters"),"""
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

