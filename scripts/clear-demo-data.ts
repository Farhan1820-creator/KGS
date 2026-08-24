import { db } from "../db/index";
import { taskAssignments, tasks, notes, diaryEntries } from "../db/schema";

async function clearDemoData() {
  console.log("Starting demo data clearance...");

  // 1. Delete task assignments
  const deletedAssignments = await db.delete(taskAssignments);
  console.log("✓ Cleared task_assignments table");

  // 2. Delete tasks
  const deletedTasks = await db.delete(tasks);
  console.log("✓ Cleared tasks table");

  // 3. Delete notes
  const deletedNotes = await db.delete(notes);
  console.log("✓ Cleared notes table");

  // 4. Delete diary entries
  const deletedDiary = await db.delete(diaryEntries);
  console.log("✓ Cleared diary_entries table");

  console.log("All requested tables (tasks, notes, diary) have been cleared successfully!");
}

clearDemoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Clear data failed:", err);
    process.exit(1);
  });
