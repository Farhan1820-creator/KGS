import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Running migration for notes youtube_url and note_comments...");

  // 1. Add youtube_url to notes if not exists
  await sql`
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);
  `;
  console.log("Added youtube_url column to notes table (if not existed).");

  // 2. Create note_comments table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS note_comments (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;
  console.log("Created note_comments table (if not existed).");

  console.log("Migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
