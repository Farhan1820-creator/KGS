# What's built (fully wired)

- `db/schema.ts` — users (with role enum), students, teachers, classes, subjects + relations
- `app/globals.css` — `.page-shell` class, apply to every page's root div for consistent width/padding
- `components/layout/sidebar.tsx` — collapsible sidebar
- `components/layout/top-header.tsx` — shows current page name from pathname
- `app/(dashboard)/layout.tsx` — wraps sidebar + header + `<Toaster />` around all 3 pages
- `components/layout/page-toolbar.tsx` — generic filter row (search/select) + Add button, reusable
- `components/layout/data-table.tsx` — generic shadcn table w/ pagination + rows-per-page, reusable
- **Students** — full slice: `lib/validations/student.ts` (zod) → `actions/student-actions.ts`
  (server action, transactional insert, toast + field errors) → `student-dialog.tsx` → `student-columns.tsx`
  → `page.tsx` (single relational query, no N+1) → `students-client.tsx`

# What you replicate for Teachers and Settings (Subject/Class)

Same pattern, different fields:

**Teachers** — copy `student-*` files, swap:
- `lib/validations/teacher.ts`: name, email, password, contactNumber, subjectId (no rollNumber)
- `actions/teacher-actions.ts`: insert into `users` (role: "teacher") + `teachers` table
- filters: search by name/contact, select filter by subject

**Settings (Subject / Class)** — simpler, no `users` row involved:
- Subject form: name, code
- Class form: name, section
- No password/email fields, no transaction needed — single table insert
- Settings page can be two tabs or two stacked tables (Subjects, Classes), each with its own
  toolbar+dialog+table using the same `PageToolbar` / `DataTable` components

# Before you wire this into your real project

1. Confirm the ERD assumption: 1 student → 1 class, 1 teacher → 1 subject. If a teacher can
   teach multiple subjects, `teachers.subjectId` needs to become a join table instead.
2. `bcryptjs`, `@tanstack/react-table`, `react-hook-form`, `@hookform/resolvers`, `zod`, `sonner`
   need to be installed — not included here.
3. `db/index.ts` (your Drizzle client init) isn't included — wire it to your Neon connection string.
4. Toast on client is done — server-side duplicate-email check uses Postgres error code `23505`;
   confirm that matches your Neon driver's error shape.
