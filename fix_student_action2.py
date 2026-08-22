import os
filepath = "app/(dashboard)/students/student-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("    }\n  };\n  }\n}\n\n// Soft-deactivates", "    }\n  }\n\n// Soft-deactivates")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

