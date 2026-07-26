import { pgTable, serial, varchar, integer, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["student", "teacher", "admin"]);

// Single users table — auth + shared fields (email/password) for anyone who logs in
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // hashed, never plain
  contactNumber: varchar("contact_number", { length: 20 }),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g. "10"
  section: varchar("section", { length: 20 }), // e.g. "A"
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  rollNumber: varchar("roll_number", { length: 20 }),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id),
});

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


// Relations — lets you do db.query.students.findMany({ with: { user: true, class: true } })
// instead of separate queries (avoids N+1 / extra round-trips)
export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
}));

export const teachersRelations = relations(teachers, ({ one }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  subject: one(subjects, { fields: [teachers.subjectId], references: [subjects.id] }),
}));
