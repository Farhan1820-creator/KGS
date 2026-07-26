import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Admin",
  description: "Student, Teacher and Settings management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
