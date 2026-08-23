import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { students, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveStudentClass } from "./onboarding-actions";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = parseInt(session.user.id);

  // If student already has a class → skip onboarding
  const [student] = await db
    .select({ classId: students.classId })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  if (student?.classId) redirect("/notes");

  // Fetch all available classes
  const allClasses = await db
    .select({ id: classes.id, name: classes.name, section: classes.section })
    .from(classes)
    .orderBy(classes.name, classes.section);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <GraduationCap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">One Last Step!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Select your class so we can show you the right notes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-xl shadow-blue-50">
          <p className="mb-4 text-sm font-semibold text-gray-700">Select your class:</p>

          <form className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allClasses.map((cls) => (
                <button
                  key={cls.id}
                  formAction={saveStudentClass.bind(null, cls.id)}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-5 text-center transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <div className="mb-1 text-2xl">📚</div>
                  <p className="text-sm font-semibold text-gray-800">
                    {cls.name}
                    {cls.section ? ` – ${cls.section}` : ""}
                  </p>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent transition group-hover:ring-blue-200" />
                </button>
              ))}
            </div>

            {allClasses.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No classes available yet. Please contact the academy.
              </div>
            )}
          </form>
        </div>

        {/* Logo footer */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Image
            src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"
            alt="The Learnex Academy"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-xs text-gray-400">The Learnex Academy</span>
        </div>
      </div>
    </div>
  );
}
