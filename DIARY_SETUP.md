# Diary feature — setup steps

## 1. Schema
Copy the contents of `db/schema-diary-addition.ts` into your real `db/schema.ts`
(merge the imports with your existing ones — don't duplicate `pgTable`/`relations` imports).
Then migrate: `npx drizzle-kit push`.

## 2. Cloudinary (unsigned upload, no server SDK needed)
1. Cloudinary dashboard → Settings → Upload → Add upload preset → **Signing mode: Unsigned**.
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
   ```
   These must be `NEXT_PUBLIC_` — the upload happens directly from the browser.

## 3. Sidebar
Already patched — added a "Diary" link. If you have a `top-header.tsx` title map,
add `"/diary": "Diary"` yourself (I don't have that file to edit safely).

## 4. How it works
- One `page.tsx`, not three separate role files. Student/teacher/admin differ only in:
  student → locked to own class, no composer, no edit/delete.
  teacher → class dropdown, composer, edit/delete on own messages only.
  admin → class dropdown, composer, edit/delete on any message.
  Server-side `requireWriter()` in `diary-actions.ts` re-checks role — never trust the
  client on who can post, even though the UI already hides the composer from students.
- File upload happens client-side directly to Cloudinary (`lib/cloudinary-upload.ts`),
  then only the resulting URL is sent to `createDiaryEntry` — your server never touches
  the file bytes.
- `?classId=` in the URL drives which class is shown for teacher/admin — lets the
  browser back button and refresh both behave correctly, and matches the "refresh is fine"
  choice you made instead of websockets.

## Before wiring in
- `students.classId` must be set for a student to see their diary — same assumption as
  the Students page (1 student → 1 class).
- File size/type limits aren't enforced client-side yet — Cloudinary will reject by your
  preset's configured limits, but the UI won't show a friendly error for that case yet.
