"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface PayrollTabsProps {
  tab: "payroll" | "attendance";
  payrollContent: ReactNode;
  attendanceContent: ReactNode;
}

export function PayrollTabs({ tab, payrollContent, attendanceContent }: PayrollTabsProps) {
  const router = useRouter();

  function handleChange(value: string) {
    router.push(`/payroll?tab=${value}`);
  }

  return (
    <Tabs value={tab} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>
      <TabsContent value="payroll">{payrollContent}</TabsContent>
      <TabsContent value="attendance">{attendanceContent}</TabsContent>
    </Tabs>
  );
}
