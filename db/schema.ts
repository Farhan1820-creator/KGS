import { pgTable, serial, varchar, integer, timestamp, pgEnum, text, unique, boolean, date, numeric } from "drizzle-orm/pg-core";
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
  // Soft-delete flag — set to false when a student/teacher leaves instead of
  // deleting their record. All financial history, attendance, and diary entries
  // are preserved. Flip back to true for re-admissions.
  isActive: boolean("is_active").notNull().default(true),
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

export const studentStatusEnum = pgEnum("student_status", ["active", "website", "inactive"]);

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  rollNumber: varchar("roll_number", { length: 20 }).unique(), // system-generated, e.g. "2026-STD-014"
  // Per-student monthly fee override. When set, this is used instead of the
  // class's fee structure amount at generation time — lets each student have
  // an individual fee (scholarships, discounts, custom plans, etc).
  fee: integer("fee"),
  admissionDate: date("admission_date"), // "YYYY-MM-DD"
  photoUrl: varchar("photo_url", { length: 500 }), // Cloudinary URL
  status: studentStatusEnum("status").notNull().default("active"),
  schoolName: varchar("school_name", { length: 255 }),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id), // legacy single subject column
  teacherId: varchar("teacher_id", { length: 20 }).unique(), // system-generated, e.g. "2026-TCH-007"
  joinDate: date("join_date"), // "YYYY-MM-DD"
});

// Many-to-many join table for multiple subjects per teacher
export const teacherSubjects = pgTable(
  "teacher_subjects",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  },
  (table) => ({
    teacherSubjectUnique: unique().on(table.teacherId, table.subjectId),
  })
);

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

// ---- Notes ---------------------------------------------------------------
// Study materials (PDFs, images, docs, etc.) uploaded by teachers/admin and
// filtered per class so each student only sees notes for their own class.

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),     // Cloudinary URL
  fileName: varchar("file_name", { length: 255 }).notNull(),   // original file name
  fileType: varchar("file_type", { length: 50 }).notNull(),    // "pdf", "image/png", "application/vnd.ms-powerpoint", etc.
  fileSize: integer("file_size"),                              // bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  uploader: one(users, { fields: [notes.uploadedBy], references: [users.id] }),
  class: one(classes, { fields: [notes.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [notes.subjectId], references: [subjects.id] }),
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
  notes: many(notes),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teachers: many(teachers),
  teacherSubjects: many(teacherSubjects),
  notes: many(notes),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  subject: one(subjects, { fields: [teachers.subjectId], references: [subjects.id] }),
  teacherSubjects: many(teacherSubjects),
  employee: one(employees, { fields: [teachers.id], references: [employees.teacherId] }),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherSubjects.teacherId], references: [teachers.id] }),
  subject: one(subjects, { fields: [teacherSubjects.subjectId], references: [subjects.id] }),
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
  date: date("date").notNull(), // "YYYY-MM-DD" — keeps range/month filtering simple, same approach as fees.month
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
  basicSalary: integer("basic_salary").notNull().default(0),
  allowances: integer("allowances").notNull().default(0), // fixed monthly allowance, on top of basic
  // "YYYY-MM-DD" — for teachers this is copied from teachers.joinDate whenever
  // they're synced (see syncTeacherEmployees), so attendance/salary reports
  // never count days before the person actually joined as "absent". For
  // staff, it's stamped with today's date at creation.
  joinDate: date("join_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  teacher: one(teachers, { fields: [employees.teacherId], references: [teachers.id] }),
  attendance: many(attendance),
  leaveRequests: many(leaveRequests),
}));

// Flexible, date-effective weekly timetable. e.g. "8am-10am Mon-Sat" now,
// "8am-1pm Mon-Sat, 8am-12pm Fri" later — each schedule only applies from
// its `effectiveFrom` date onward, so past attendance/salary keeps the hours
// that were actually in effect at the time. A day of week with no row in the
// active schedule is a non-working (off) day.
export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  // Null until this template is applied — a draft that isn't live yet.
  // Auto-stamped with today's date the moment an admin clicks "Apply"; never
  // entered by hand, so there's no confusing date picker in the UI anymore.
  effectiveFrom: date("effective_from"), // "YYYY-MM-DD"
  appliedAt: timestamp("applied_at"), // tie-breaker when two schedules share an effectiveFrom date
  isActive: boolean("is_active").notNull().default(false), // only one row is true at a time
  label: varchar("label", { length: 100 }), // e.g. "Summer Camp Hours"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduleDays = pgTable(
  "schedule_days",
  {
    id: serial("id").primaryKey(),
    scheduleId: integer("schedule_id").notNull().references(() => workSchedules.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday..6=Saturday
    startTime: varchar("start_time", { length: 5 }).notNull(), // "HH:MM", 24h
    endTime: varchar("end_time", { length: 5 }).notNull(),
  },
  (table) => ({
    scheduleDayUnique: unique().on(table.scheduleId, table.dayOfWeek),
  })
);

export const workSchedulesRelations = relations(workSchedules, ({ many }) => ({
  days: many(scheduleDays),
}));

export const scheduleDaysRelations = relations(scheduleDays, ({ one }) => ({
  schedule: one(workSchedules, { fields: [scheduleDays.scheduleId], references: [workSchedules.id] }),
}));

// Specific-date off days (holidays/vacations) — override the weekly schedule
// Each row is one calendar date that's non-working for everyone, regardless of
// weekday. Admin adds these either by clicking a date on the off-days calendar
// ("manual") or by importing an event pulled from the synced Google Calendar
// iCal feed ("google").
export const offDates = pgTable("off_dates", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // "YYYY-MM-DD"
  label: varchar("label", { length: 150 }), // e.g. "Eid Holiday", pulled from calendar event title if imported
  source: varchar("source", { length: 20 }).notNull().default("manual"), // "manual" | "google"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Small key/value settings store. Currently just holds the admin-configured
// public Google Calendar iCal URL used to pull upcoming vacations, but kept
// generic so other simple app-wide settings can reuse it later.
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
});

// ---- Attendance -----------------------------------------------------------

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "half_day", "absent", "leave"]);

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(), // "YYYY-MM-DD"
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
  fromDate: date("from_date").notNull(), // "YYYY-MM-DD"
  toDate: date("to_date").notNull(),
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

// ---- Student Attendance -----------------------------------------------------

export const studentAttendanceStatusEnum = pgEnum("student_attendance_status", ["present", "absent", "leave"]);

export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // "YYYY-MM-DD"
  status: studentAttendanceStatusEnum("status").notNull(),
  markedBy: integer("marked_by").references(() => users.id, { onDelete: "set null" }),
  lastEditedBy: integer("last_edited_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  studentDateUnique: unique().on(table.studentId, table.date)
}));

export const studentAttendanceRelations = relations(studentAttendance, ({ one }) => ({
  student: one(students, { fields: [studentAttendance.studentId], references: [students.id] }),
  class: one(classes, { fields: [studentAttendance.classId], references: [classes.id] }),
  marker: one(users, { fields: [studentAttendance.markedBy], references: [users.id] }),
  editor: one(users, { fields: [studentAttendance.lastEditedBy], references: [users.id] }),
}));

// ---- Test Marks -------------------------------------------------------------

export const testMarks = pgTable("test_marks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // "YYYY-MM"
  totalMarks: integer("total_marks").notNull(),
  achievedMarks: integer("achieved_marks").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testMarksRelations = relations(testMarks, ({ one }) => ({
  student: one(students, { fields: [testMarks.studentId], references: [students.id] }),
  class: one(classes, { fields: [testMarks.classId], references: [classes.id] }),
  creator: one(users, { fields: [testMarks.createdBy], references: [users.id] }),
}));

// ---- Notifications ----------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

// ---- Tasks / Quests --------------------------------------------------------

export const taskStatusEnum = pgEnum("task_status", ["pending", "submitted", "graded"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  classId: integer("class_id").references(() => classes.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  dueDate: date("due_date"), // "YYYY-MM-DD"
  totalPoints: integer("total_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    status: taskStatusEnum("status").notNull().default("pending"),
    submissionText: text("submission_text"),
    submissionImageUrl: varchar("submission_image_url", { length: 500 }),
    submittedAt: timestamp("submitted_at"),
    achievedPoints: integer("achieved_points"),
    percentage: numeric("percentage", { precision: 5, scale: 2 }),
    feedback: text("feedback"),
    gradedBy: integer("graded_by").references(() => users.id, { onDelete: "set null" }),
    gradedAt: timestamp("graded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    taskStudentUnique: unique().on(table.taskId, table.studentId),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  teacher: one(users, { fields: [tasks.teacherId], references: [users.id] }),
  subject: one(subjects, { fields: [tasks.subjectId], references: [subjects.id] }),
  class: one(classes, { fields: [tasks.classId], references: [classes.id] }),
  assignments: many(taskAssignments),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignments.taskId], references: [tasks.id] }),
  student: one(students, { fields: [taskAssignments.studentId], references: [students.id] }),
  grader: one(users, { fields: [taskAssignments.gradedBy], references: [users.id] }),
}));
