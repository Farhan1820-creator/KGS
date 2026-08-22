import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "teacher" | "student" | "staff";
      studentStatus?: "active" | "website" | "inactive";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "teacher" | "student" | "staff";
    studentStatus?: "active" | "website" | "inactive";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "admin" | "teacher" | "student" | "staff";
    studentStatus?: "active" | "website" | "inactive";
  }
}