import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Notes — The Learnex Academy",
  description: "Access your class notes and study material.",
};

export default function StudentPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-white to-[#EEF4FF]">
      {children}
    </div>
  );
}
