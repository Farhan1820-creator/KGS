import { db } from "../db/index";
import { students, users, classes } from "../db/schema";
import { eq } from "drizzle-orm";

async function getStudentCredentials() {
  const allStudents = await db.query.students.findMany({
    with: {
      user: true,
      class: true,
    },
    orderBy: (s, { asc }) => [asc(s.id)],
  });

  const list = allStudents.map((s) => ({
    id: s.id,
    name: s.user.name,
    rollNumber: s.rollNumber || "N/A",
    className: s.class ? `${s.class.name}${s.class.section ? ` (${s.class.section})` : ""}` : "Not Assigned",
    email: s.user.email,
    contactNumber: s.user.contactNumber || "N/A",
    status: s.status,
  }));

  console.log(JSON.stringify(list, null, 2));
}

getStudentCredentials()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
