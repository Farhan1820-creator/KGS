"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";

export type StudentRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  classId: number | null;
  className: string | null;
  rollNumber: string | null;
  fee: number | null; // this student's own fee override, if any
  admissionDate: string | null;
  photoUrl: string | null;
  schoolName: string | null;
  isActive: boolean;
  status: "active" | "website" | "inactive";
  // overall status across every month from admission date to now — "paid" only
  // if all months are settled, "unpaid" if none are, "pending" if mixed.
  // null = no admission date on file, so the range can't be determined.
  feeStatus: "paid" | "unpaid" | "pending" | null;
};

interface StudentColumnsOptions {
  onViewFeeDetails: (row: StudentRow) => void;
  onViewAttendance: (row: StudentRow) => void;
  onUpdateStatus: (row: StudentRow, status: "Active" | "Website" | "Inactive") => void;
}

export function getStudentColumns({ onViewFeeDetails, onViewAttendance, onUpdateStatus }: StudentColumnsOptions): ColumnDef<StudentRow>[] {
  return [
    {
      id: "photo",
      header: "",
      cell: ({ row }) =>
        row.original.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.photoUrl}
            alt={row.original.name}
            className="h-8 w-8 rounded-full object-cover border"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border">
            {row.original.name.slice(0, 1).toUpperCase()}
          </div>
        ),
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contactNumber", header: "Contact" },
    { accessorKey: "className", header: "Class" },
    { accessorKey: "rollNumber", header: "Roll No." },
    { accessorKey: "admissionDate", header: "Admission Date", cell: ({ row }) => row.original.admissionDate ?? "—" },
    {
      id: "attendance",
      header: "Attendance",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onViewAttendance(row.original);
          }}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          View Attendance
        </Button>
      ),
    },
    {
      accessorKey: "feeStatus",
      header: "Fee Status",
      cell: ({ row }) => {
        const status = row.original.feeStatus;
        const badgeClass =
          status === "paid"
            ? "bg-green-600 hover:bg-green-600 text-white"
            : status === "pending"
              ? "bg-yellow-500 hover:bg-yellow-500 text-white"
              : "bg-red-600 hover:bg-red-600 text-white";
        const label = status === "paid" ? "Paid" : status === "pending" ? "Pending" : "Unpaid";
        return (
          <div className="flex flex-col items-start gap-1">
            {status ? (
              <Badge className={badgeClass}>{label}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Not generated</span>
            )}
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onViewFeeDetails(row.original);
              }}
            >
              Details
            </Button>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.isActive;
        const studentStatus = row.original.status;
        
        let currentStatus = "Inactive";
        if (active) {
          currentStatus = studentStatus === "active" ? "Active" : "Website";
        }
        
        const colors = {
          Active: "border-green-500 text-green-600 bg-green-50",
          Website: "border-blue-500 text-blue-600 bg-blue-50",
          Inactive: "border-red-400 text-red-500 bg-red-50"
        }[currentStatus];

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={currentStatus}
              onChange={(e) => onUpdateStatus(row.original, e.target.value as any)}
              className={`text-xs font-semibold py-1.5 px-2.5 rounded-md border outline-none cursor-pointer transition ${colors}`}
            >
              <option value="Active" className="text-gray-900 bg-white">Active</option>
              <option value="Website" className="text-gray-900 bg-white">Website</option>
              <option value="Inactive" className="text-gray-900 bg-white">Inactive</option>
            </select>
          </div>
        );
      },
    },
  ];
}