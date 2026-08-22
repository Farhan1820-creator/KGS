import os
import re

filepath = "app/(dashboard)/payroll/attendance/attendance-actions.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# I want to replace the `joinDate: t.joinDate ?? todayString()` with `joinDate: firstDayOfCurrentMonth` in syncTeacherEmployees
# I also need to calculate firstDayOfCurrentMonth
replacement = """export async function syncTeacherEmployees(): Promise<ActionResult<Record<string, never>>> {
  try {
    const allTeachers = await db.query.teachers.findMany({ with: { user: true, subject: true, employee: true } });
    
    // We want attendance to be calculated from the 1st of the current month when they are synced
    const now = new Date();
    // Using simple YYYY-MM-01 format
    const firstOfCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const missing = allTeachers.filter((t) => !t.employee);
    // If they have an employee record but the join date is different from the sync policy (we will just sync those whose join date is totally off from what it should be? Wait, actually if they are already there, we maybe don't want to overwrite their old attendance? The user said "jb teacher ko payroll mein sync krn to current month k 1st date se uski attendance calculate ho".)
    // Let's just set all outOfSync to the teacher's joinDate, OR if the user means NEWLY synced teachers start from 1st of current month, we just do it for `missing`. 
    // Actually, setting joinDate to first of current month makes sure they aren't marked absent for past months.
    const outOfSync = allTeachers.filter((t) => t.employee && t.employee.joinDate !== (t.joinDate ?? null) && t.employee.joinDate !== firstOfCurrentMonth);

    for (const t of missing) {
      await db.insert(employees).values({
        userId: t.userId,
        teacherId: t.id,
        employeeType: "teacher",
        designation: t.subject ? `${t.subject.name} Teacher` : "Teacher",
        basicSalary: 0,
        allowances: 0,
        joinDate: firstOfCurrentMonth,
      });
    }

    for (const t of outOfSync) {
      await db
        .update(employees)
        .set({ joinDate: firstOfCurrentMonth })
        .where(eq(employees.id, t.employee!.id));
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch (err) {
    return { success: false, errors: { root: ["Could not sync teachers."] } };
  }
}"""

content = re.sub(r"export async function syncTeacherEmployees\(\)[\s\S]*?return \{ success: false, errors: \{ root: \[\"Could not sync teachers\.\"\] \} \};\s*\}\s*\}", replacement, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

