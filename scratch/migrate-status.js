import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("Creating enum type if not exists...");
    await sql`DO $$ BEGIN
        CREATE TYPE student_status AS ENUM ('active', 'website', 'inactive');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`;

    console.log("Adding status column...");
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS status student_status NOT NULL DEFAULT 'active';`;

    console.log("Migrating data from is_academy_student to status...");
    await sql`UPDATE students SET status = 'website' WHERE is_academy_student = false;`;

    console.log("Dropping is_academy_student column...");
    await sql`ALTER TABLE students DROP COLUMN IF EXISTS is_academy_student;`;

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

main();
