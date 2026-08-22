import os
filepath = "app/(dashboard)/students/student-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
"""const emptyDefaults: StudentFormValues = {
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  classId: "",
  fee: "",
  admissionDate: todayDate(),
  photoUrl: "",
  schoolName: "",
};""",
"""const emptyDefaults: StudentAnyFormValues = {
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  classId: "",
  rollNumber: "",
  fee: "",
  admissionDate: todayDate(),
  photoUrl: "",
  schoolName: "",
};"""
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

