import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("Adding raw_password column to users table if not exists...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_password VARCHAR(255);`;

    console.log("Backfilling raw_password from contact_number where raw_password is null...");
    await sql`UPDATE users SET raw_password = contact_number WHERE raw_password IS NULL AND contact_number IS NOT NULL;`;

    console.log("Column raw_password added successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
