import os
filepath = "app/(dashboard)/teachers/teacher-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add autoComplete to the form
content = content.replace("<form\n                onSubmit={handleSubmit(onSubmit)}", "<form\n                autoComplete=\"off\"\n                onSubmit={handleSubmit(onSubmit)}")

# Add autoComplete to email inputs
content = content.replace("id=\"email\"\n                              type=\"text\"", "id=\"email\"\n                              type=\"text\"\n                              autoComplete=\"off\"\n                              data-lpignore=\"true\"")
content = content.replace("<Input id=\"email\" type=\"email\" placeholder=\"teacher@example.com\"", "<Input id=\"email\" type=\"email\" autoComplete=\"off\" data-lpignore=\"true\" placeholder=\"teacher@example.com\"")

# Add autoComplete to password input
content = content.replace("<Input id=\"password\" type=\"password\"", "<Input id=\"password\" type=\"password\" autoComplete=\"new-password\" data-lpignore=\"true\"")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

