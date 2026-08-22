import os
filepath = "app/(dashboard)/teachers/teacher-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("email: teacher.email || \"\",\n          password: \"\",", "email: \"\",\n  password: \"\",")
content = content.replace("reset({\n          name: teacher.name,\n          email: \"\",\n  password: \"\",", "reset({\n          name: teacher.name,\n          email: teacher.email || \"\",\n          password: \"\",")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

