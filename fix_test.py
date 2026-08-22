import os
filepath = "app/(dashboard)/dashboard/test-reports/test-reports-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { sendNotification } from \"@/lib/notifications\";\nimport { students } from \"@/db/schema\";\n\"use server\";\n\nimport { db } from \"@/db\";", "\"use server\";\nimport { sendNotification } from \"@/lib/notifications\";\nimport { students } from \"@/db/schema\";\n\nimport { db } from \"@/db\";")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

