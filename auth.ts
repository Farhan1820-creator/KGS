import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        // Google-registered users have no password — block credential login for them
        if (!user.password) return null;

        const passwordMatches = await compare(password, user.password);
        if (!passwordMatches) return null;

        let studentStatus: "active" | "website" | "inactive" | undefined;
        if (user.role === "student") {
          const [student] = await db
            .select({ status: students.status })
            .from(students)
            .where(eq(students.userId, user.id))
            .limit(1);
          studentStatus = (student?.status as "active" | "website" | "inactive" | undefined) ?? "active";
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          studentStatus,
        };
      },
    }),
  ],
  callbacks: {
    // Handle Google sign-in: upsert user in our DB if they don't exist yet
    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        if (!user.email || !user.name) return false;

        const [existing] = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (!existing) {
          // New Google user → create user + student record (website student)
          const fakeHash = await hash(crypto.randomUUID(), 10); // placeholder password
          const [newUser] = await db
            .insert(users)
            .values({
              name: user.name,
              email: user.email,
              password: fakeHash,
              role: "student",
            })
            .returning({ id: users.id });

          await db.insert(students).values({
            userId: newUser.id,
            status: "website",
          });
        }
      }
      return true;
    },

    jwt: async ({ token, user, account }) => {
      if (user) {
        // First sign-in via Credentials — user object has our custom fields
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.studentStatus = (user as { studentStatus?: string }).studentStatus;
      }

      if (account?.provider === "google" && token.email) {
        // Google flow: fetch our DB user to get id + role
        const [dbUser] = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.email, token.email as string))
          .limit(1);

        if (dbUser) {
          token.id = String(dbUser.id);
          token.role = dbUser.role;
          token.studentStatus = "website"; // Google → always a website student
        }
      }

      return token;
    },

    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "teacher" | "student" | "staff";
        session.user.studentStatus = token.studentStatus as "active" | "website" | "inactive" | undefined;
      }
      return session;
    },
  },
});
