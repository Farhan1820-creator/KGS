"use server";

import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { signIn } from "@/auth";

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

export async function registerWebsiteStudent(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!name.trim() || !email.trim() || !password) {
    return { success: false, error: "All fields are required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  // Check for existing account
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const hashed = await hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      rawPassword: password,
      role: "student",
    })
    .returning({ id: users.id });

  // Create student record — website visitor, no roll number, no class yet
  await db.insert(students).values({
    userId: newUser.id,
    status: "website",
  });

  // Auto sign-in after registration
  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });
  } catch {
    // signIn may throw a redirect error in some NextAuth versions — that's fine
  }

  return { success: true };
}
