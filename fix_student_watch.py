import os
filepath = "app/(dashboard)/students/student-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """  } = useForm<StudentAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? studentSchema : studentUpdateSchema) as any) as Resolver<StudentAnyFormValues>,
    defaultValues: emptyDefaults as StudentAnyFormValues,
  });

  const nameVal = watch("name");
  const contactVal = watch("contactNumber");

  // Auto-generate email and password in create mode
  useEffect(() => {
    if (mode === "create") {
      const prefix = (nameVal || "").toLowerCase().replace(/\s+/g, "");
      setValue("email", prefix ? `${prefix}@student.learnex` : "", { shouldValidate: !!prefix });
    }
  }, [nameVal, mode, setValue]);

  useEffect(() => {
    if (mode === "create") {
      setValue("password", contactVal || "", { shouldValidate: !!contactVal });
    }
  }, [contactVal, mode, setValue]);"""

content = content.replace("""  } = useForm<StudentAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? studentSchema : studentUpdateSchema) as any) as Resolver<StudentAnyFormValues>,
    defaultValues: emptyDefaults as StudentAnyFormValues,
  });""", replacement)

# Now fix the UI for Email in create mode
email_ui_replacement = """                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    {mode === "create" ? (
                      <div className="flex items-center h-10">
                        <Input 
                          id="email"
                          type="text"
                          className="rounded-r-none h-full"
                          placeholder="student"
                          value={(watch("email") || "").replace("@student.learnex", "")}
                          onChange={(e) => setValue("email", e.target.value + "@student.learnex", { shouldValidate: true })}
                        />
                        <span className="inline-flex items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground h-full whitespace-nowrap">
                          @student.learnex
                        </span>
                      </div>
                    ) : (
                      <Input id="email" type="email" placeholder="student@example.com" {...register("email")} />
                    )}
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>"""

import re
content = re.sub(r"<div className=\"space-y-1\">\s*<Label htmlFor=\"email\">Email</Label>\s*<Input id=\"email\" type=\"email\" placeholder=\"student@example\.com\" \{\.\.\.register\(\"email\"\)\} />\s*\{errors\.email && <p className=\"text-sm text-red-500\">\{errors\.email\.message\}</p>\}\s*</div>", email_ui_replacement, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

