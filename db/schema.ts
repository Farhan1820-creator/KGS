import { pgTable, serial, varchar, integer, timestamp, pgEnum, text, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["student", "teacher", "admin", "staff"]);

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
  // Per-student monthly fee override. When set, this is used instead of the
  // class's fee structure amount at generation time — lets each student have
  // an individual fee (scholarships, discounts, custom plans, etc).
  fee: integer("fee"),
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


export const feeStatusEnum = pgEnum("fee_status", ["paid", "unpaid"]);

// Class-wise default monthly fee. Used to auto-generate `fees` rows for a
// month, but each student's `fees.amount` can still be overridden individually.
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // monthly fee in PKR
});

export const fees = pgTable(
  "fees",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(), // "YYYY-MM" — keeps month filtering/grouping simple
    amount: integer("amount").notNull(),
    status: feeStatusEnum("status").default("unpaid").notNull(),
    paidDate: timestamp("paid_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // one fee record per student per month — generation is idempotent
    studentMonthUnique: unique().on(table.studentId, table.month),
  })
);

export const feeStructuresRelations = relations(feeStructures, ({ one }) => ({
  class: one(classes, { fields: [feeStructures.classId], references: [classes.id] }),
}));

export const feesRelations = relations(fees, ({ one }) => ({
  student: one(students, { fields: [fees.studentId], references: [students.id] }),
}));

// Relations — lets you do db.query.students.findMany({ with: { user: true, class: true } })
// instead of separate queries (avoids N+1 / extra round-trips)
export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  fees: many(fees),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  students: many(students),
  feeStructures: many(feeStructures),
}));

export const teachersRelations = relations(teachers, ({ one }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  subject: one(subjects, { fields: [teachers.subjectId], references: [subjects.id] }),
  employee: one(employees, { fields: [teachers.id], references: [employees.teacherId] }),
}));

// ---- Expenses ----------------------------------------------------------

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const expenseSubCategories = pgTable(
  "expense_sub_categories",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull().references(() => expenseCategories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
  },
  (table) => ({
    // a sub-category name only needs to be unique within its parent category
    categoryNameUnique: unique().on(table.categoryId, table.name),
  })
);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => expenseCategories.id, { onDelete: "restrict" }),
  subCategoryId: integer("sub_category_id").references(() => expenseSubCategories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 150 }).notNull(),
  amount: integer("amount").notNull(), // PKR
  date: varchar("date", { length: 10 }).notNull(), // "YYYY-MM-DD" — keeps range/month filtering simple, same approach as fees.month
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  subCategories: many(expenseSubCategories),
  expenses: many(expenses),
}));

export const expenseSubCategoriesRelations = relations(expenseSubCategories, ({ one, many }) => ({
  category: one(expenseCategories, { fields: [expenseSubCategories.categoryId], references: [expenseCategories.id] }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, { fields: [expenses.categoryId], references: [expenseCategories.id] }),
  subCategory: one(expenseSubCategories, { fields: [expenses.subCategoryId], references: [expenseSubCategories.id] }),
}));

// ---- Employees (Attendance + Payroll) ------------------------------------
// A unified table for anyone whose attendance/salary is tracked: teachers
// AND non-teaching staff (peon, accountant, etc). Teachers get a linked
// `teacherId`; pure staff members don't.

export const employeeTypeEnum = pgEnum("employee_type", ["teacher", "staff"]);

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "set null" }), // set only for employeeType "teacher"
  employeeType: employeeTypeEnum("employee_type").notNull(),
  designation: varchar("designation", { length: 100 }).notNull(), // e.g. "Math Teacher", "Peon", "Accountant"
  shiftHours: integer("shift_hours").notNull().default(8), // hours/day required for a full "Present" day — set per employee
  basicSalary: integer("basic_salary").notNull().default(0),
  allowances: integer("allowances").notNull().default(0), // fixed monthly allowance, on top of basic
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  teacher: one(teachers, { fields: [employees.teacherId], references: [teachers.id] }),
  attendance: many(attendance),
  leaveRequests: many(leaveRequests),
}));

// Weekly off days. Admin toggles which days of the week (0=Sunday..6=Saturday)
// are non-working — those dates are excluded from absent/leave calculations.
export const offDays = pgTable("off_days", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull().unique(), // 0-6
});

// ---- Attendance -----------------------------------------------------------

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "half_day", "absent", "leave"]);

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // "YYYY-MM-DD"
    checkIn: timestamp("check_in"),
    checkOut: timestamp("check_out"),
    secondsWorked: integer("seconds_worked"), // seconds worked, computed on check-out (second-level precision)
    status: attendanceStatusEnum("status").notNull().default("absent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    employeeDateUnique: unique().on(table.employeeId, table.date),
  })
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, { fields: [attendance.employeeId], references: [employees.id] }),
}));

// ---- Leave Requests ---------------------------------------------------------

export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  fromDate: varchar("from_date", { length: 10 }).notNull(), // "YYYY-MM-DD"
  toDate: varchar("to_date", { length: 10 }).notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").notNull().default("pending"),
  decidedBy: integer("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, { fields: [leaveRequests.employeeId], references: [employees.id] }),
  decider: one(users, { fields: [leaveRequests.decidedBy], references: [users.id] }),
}));
