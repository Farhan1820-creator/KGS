"use client";

import { useState, useEffect, useTransition } from "react";
import { getAttendanceData, saveAttendance } from "./attendance-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type ClassType = { id: number; name: string; section: string | null };

export function AttendanceClient({ classes }: { classes: ClassType[] }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, any>>({});
  const [role, setRole] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // Local state to track edits before saving
  const [edits, setEdits] = useState<Record<number, "present" | "absent" | "leave">>({});

  useEffect(() => {
    if (classId && date) {
      fetchData();
    }
  }, [classId, date]);

  const fetchData = async () => {
    setLoading(true);
    setEdits({});
    try {
      const data = await getAttendanceData(parseInt(classId), date);
      setStudents(data.students);
      setAttendance(data.attendance);
      setRole(data.currentUserRole);
    } catch (e) {
      toast.error("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: "present" | "absent" | "leave") => {
    setEdits(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    const payload = students.map(s => {
      const status = edits[s.id] || attendance[s.id]?.status;
      return status ? { studentId: s.id, status } : null;
    }).filter(Boolean) as Array<{ studentId: number, status: "present" | "absent" | "leave" }>;

    if (payload.length === 0) {
      toast.error("No attendance marked.");
      return;
    }

    startTransition(async () => {
      try {
        await saveAttendance(parseInt(classId), date, payload);
        toast.success("Attendance saved successfully.");
        fetchData();
      } catch (e) {
        toast.error("Failed to save attendance.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-lg border">
        <div className="grid gap-1.5 w-full md:w-64">
          <label className="text-sm font-medium">Date</label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
        <div className="grid gap-1.5 w-full md:w-64">
          <label className="text-sm font-medium">Class</label>
          <Select value={classId} onValueChange={(v) => setClassId(v || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name} {c.section && ` - ${c.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : classId && students.length > 0 ? (
        <div className="space-y-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[300px]">Attendance Status</TableHead>
                  {role === "admin" && <TableHead className="w-[200px]">Audit</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const record = attendance[student.id];
                  const currentStatus = edits[student.id] || record?.status;

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.rollNumber || "N/A"}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${student.id}`} 
                              value="present" 
                              checked={currentStatus === "present"}
                              onChange={() => handleStatusChange(student.id, "present")}
                              className="w-4 h-4 text-primary accent-primary cursor-pointer"
                            />
                            Present
                          </label>
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${student.id}`} 
                              value="absent" 
                              checked={currentStatus === "absent"}
                              onChange={() => handleStatusChange(student.id, "absent")}
                              className="w-4 h-4 text-destructive accent-destructive cursor-pointer"
                            />
                            Absent
                          </label>
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${student.id}`} 
                              value="leave" 
                              checked={currentStatus === "leave"}
                              onChange={() => handleStatusChange(student.id, "leave")}
                              className="w-4 h-4 text-yellow-500 accent-yellow-500 cursor-pointer"
                            />
                            Leave
                          </label>
                        </div>
                      </TableCell>
                      {role === "admin" && (
                        <TableCell className="text-xs text-muted-foreground">
                          {record ? (
                            <div className="flex flex-col gap-0.5">
                              {record.markerName && <span>Marked by: {record.markerName}</span>}
                              {record.editorName && <span>Last edit: {record.editorName}</span>}
                            </div>
                          ) : (
                            <span>Not marked</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending || Object.keys(edits).length === 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Attendance
            </Button>
          </div>
        </div>
      ) : classId ? (
        <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card">
          No active students found in this class.
        </div>
      ) : null}
    </div>
  );
}
