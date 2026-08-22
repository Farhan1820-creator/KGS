import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const leaveRequestSchema = z
  .object({
    fromDate: z.string().regex(dateRegex, "Select a valid date"),
    toDate: z.string().regex(dateRegex, "Select a valid date"),
    reason: z.string().min(3, "Please add a short reason"),
  })
  .refine((v) => v.toDate >= v.fromDate, {
    message: "End date must be on or after start date",
    path: ["toDate"],
  });
export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contactNumber: z.string().optional(),
  designation: z.string().min(2, "Designation is required"),
  basicSalary: z.coerce.number().int().min(0, "Cannot be negative"),
  allowances: z.coerce.number().int().min(0, "Cannot be negative").default(0),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

// For editing an existing employee's pay settings (no login fields).
export const employeeSettingsSchema = z.object({
  designation: z.string().min(2, "Designation is required"),
  basicSalary: z.coerce.number().int().min(0, "Cannot be negative"),
  allowances: z.coerce.number().int().min(0, "Cannot be negative").default(0),
});
export type EmployeeSettingsFormValues = z.infer<typeof employeeSettingsSchema>;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workScheduleSchema = z.object({
  label: z.string().optional(),
  days: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(timeRegex, "Invalid time"),
        endTime: z.string().regex(timeRegex, "Invalid time"),
      })
    )
    .min(1, "Select at least one working day"),
});
export type WorkScheduleFormValues = z.infer<typeof workScheduleSchema>;

export const calendarSyncSchema = z.object({
  icalUrl: z
    .string()
    .trim()
    .url("Enter a valid calendar URL")
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), "Enter a valid calendar URL"),
});
export type CalendarSyncFormValues = z.infer<typeof calendarSyncSchema>;

export const offDateSchema = z.object({
  date: z.string().regex(dateRegex, "Select a valid date"),
  label: z.string().max(150).optional(),
});
export type OffDateFormValues = z.infer<typeof offDateSchema>;

// Admin manually editing/overriding one employee's attendance for one date.
// Status is no longer picked directly — it's derived server-side from the
// times (see updateAttendanceRecord): both times present -> present/half_day
// based on hours worked; no times -> "leave" if isLeave is checked, else
// "absent". isLeave is ignored if both times are given.
export const attendanceEditSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: z.string().regex(dateRegex, "Select a valid date"),
  checkIn: z.union([z.string().regex(timeRegex, "Invalid time"), z.literal("")]).optional(),
  checkOut: z.union([z.string().regex(timeRegex, "Invalid time"), z.literal("")]).optional(),
  isLeave: z.boolean().optional().default(false),
});
export type AttendanceEditFormValues = z.infer<typeof attendanceEditSchema>;
