import os
filepath = "app/(dashboard)/students/student-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make email and password always render in form Mode
import re

replacement = """                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="student@example.com" {...register("email")} />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder={mode === "edit" ? "Leave blank to keep unchanged" : "Min. 8 characters"} {...register("password")} />
                      {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>"""

# Find the `{mode === "create" && (...)}` block
# It looks like:
# {mode === "create" && (
#   <>
#     ...email...
#     ...password...
#   </>
# )}
content = re.sub(r"\{mode === \"create\" && \(\s*<>\s*<div className=\"space-y-1\">\s*<Label htmlFor=\"email\">Email</Label>[\s\S]*?</>\s*\)\}", replacement, content)

# update reset logic to use student.email
# In useEffect for edit, reset(...) currently has email: ""
content = re.sub(r"email:\s*\"\",\s*password:\s*\"\",", "email: student.email || \"\",\n          password: \"\",", content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

