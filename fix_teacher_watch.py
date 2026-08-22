import os
filepath = "app/(dashboard)/teachers/teacher-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """  } = useForm<TeacherAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? teacherSchema : teacherUpdateSchema) as any) as Resolver<TeacherAnyFormValues>,
    defaultValues: emptyDefaults as TeacherAnyFormValues,
  });

  const nameVal = watch("name");
  const contactVal = watch("contactNumber");

  // Auto-generate email and password in create mode
  useEffect(() => {
    if (mode === "create") {
      const prefix = (nameVal || "").toLowerCase().replace(/\s+/g, "");
      setValue("email", prefix ? `${prefix}@teacher.learnex` : "", { shouldValidate: !!prefix });
    }
  }, [nameVal, mode, setValue]);

  useEffect(() => {
    if (mode === "create") {
      setValue("password", contactVal || "", { shouldValidate: !!contactVal });
    }
  }, [contactVal, mode, setValue]);"""

content = content.replace("""  } = useForm<TeacherAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? teacherSchema : teacherUpdateSchema) as any) as Resolver<TeacherAnyFormValues>,
    defaultValues: emptyDefaults as TeacherAnyFormValues,
  });""", replacement)

# Now fix the UI for Email in create mode
email_ui_replacement = """                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      {mode === "create" ? (
                        <div className="flex items-center h-10">
                          <Input 
                            id="email"
                            type="text"
                            className="rounded-r-none h-full"
                            placeholder="teacher"
                            value={(watch("email") || "").replace("@teacher.learnex", "")}
                            onChange={(e) => setValue("email", e.target.value + "@teacher.learnex", { shouldValidate: true })}
                          />
                          <span className="inline-flex items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground h-full whitespace-nowrap">
                            @teacher.learnex
                          </span>
                        </div>
                      ) : (
                        <Input id="email" type="email" placeholder="teacher@example.com" {...register("email")} />
                      )}
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>"""

import re
content = re.sub(r"<div className=\"space-y-1\">\s*<Label htmlFor=\"email\">Email</Label>\s*<Input id=\"email\" type=\"email\" placeholder=\"teacher@example\.com\" \{\.\.\.register\(\"email\"\)\} />\s*\{errors\.email && <p className=\"text-sm text-red-500\">\{errors\.email\.message\}</p>\}\s*</div>", email_ui_replacement, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

