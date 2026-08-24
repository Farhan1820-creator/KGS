import { db } from "../db/index";
import { employees, attendance } from "../db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fetching synced teacher employees...");
  const teacherEmployees = await db.query.employees.findMany({
    where: eq(employees.employeeType, "teacher"),
    with: { user: true },
  });

  console.log(`Found ${teacherEmployees.length} synced teacher employee(s) in payroll:`);
  for (const emp of teacherEmployees) {
    console.log(`- ID: ${emp.id}, User: ${emp.user?.name} (${emp.user?.email}), Designation: ${emp.designation}`);
  }

  if (teacherEmployees.length > 0) {
    const deleted = await db.delete(employees).where(eq(employees.employeeType, "teacher"));
    console.log("✓ Successfully removed all synced teacher employee testing records from payroll.");
  } else {
    console.log("No synced teacher records to remove.");
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
