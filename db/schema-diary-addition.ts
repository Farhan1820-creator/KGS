// --- Append to db/schema.ts (imports below merge with your existing ones) ---
import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, classes } from "./schema"; // adjust path if pasting into the same file

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  message: text("message"), // nullable — a file-only entry is valid
  fileUrl: varchar("file_url", { length: 500 }),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  sender: one(users, { fields: [diaryEntries.senderId], references: [users.id] }),
  class: one(classes, { fields: [diaryEntries.classId], references: [classes.id] }),
}));
