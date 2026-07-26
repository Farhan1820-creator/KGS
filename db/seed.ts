import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await db.insert(users).values({
    name: "Admin",
    email: "admin@kgs.com",
    password: passwordHash,
    role: "admin",
  });

  console.log("Admin user created successfully");
  console.log("Email: admin@kgs.com");
  console.log("Password: Admin@123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });