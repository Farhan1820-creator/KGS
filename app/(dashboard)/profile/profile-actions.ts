"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, students, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNumber: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
  password: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export async function updateProfile(formData: ProfileFormValues) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const parsed = profileSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid form data.",
    };
  }

  const { name, contactNumber, photoUrl, password } = parsed.data;
  const userId = Number(session.user.id);
  const role = session.user.role;

  try {
    const userUpdates: Record<string, any> = {
      name,
      image: photoUrl || null,
    };

    if (contactNumber !== undefined) {
      userUpdates.contactNumber = contactNumber || null;
    }

    if (password && password.length >= 8) {
      userUpdates.password = await hash(password, 10);
    }

    await db.update(users).set(userUpdates).where(eq(users.id, userId));

    // Also update role-specific photoUrl if student or teacher
    if (role === "student") {
      await db
        .update(students)
        .set({ photoUrl: photoUrl || null })
        .where(eq(students.userId, userId));
    } else if (role === "teacher") {
      await db
        .update(teachers)
        .set({ photoUrl: photoUrl || null })
        .where(eq(teachers.userId, userId));
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/(dashboard)", "layout");
    revalidatePath("/students");
    revalidatePath("/teachers");

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}
