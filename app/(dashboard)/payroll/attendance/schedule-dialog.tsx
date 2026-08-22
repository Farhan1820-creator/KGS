"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createWorkSchedule,
  editWorkSchedule,
  applyWorkSchedule,
  deleteWorkSchedule,
  toggleOffDate,
  importOffDateFromCalendar,
  setCalendarSyncUrl,
  clearCalendarSyncUrl,
  previewCalendarEvents,
} from "./attendance-actions";
import { WEEKDAY_LABELS, todayString, formatTimeLabel, getDaySchedule, type WorkSchedule } from "./attendance-helpers";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Link2, Link2Off, Settings2, Plus, Trash2, Check, Pencil } from "lucide-react";
import type { CalendarEvent } from "@/lib/ics";

interface OffDateEntry {
  date: string;
  label: string | null;
  source: string;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: WorkSchedule[];
  offDates: OffDateEntry[];
  calendarSyncUrl: string | null;
}

type DayState = { enabled: boolean; startTime: string; endTime: string };

function daysFromSchedule(schedule: WorkSchedule | null): Record<number, DayState> {
  const days: Record<number, DayState> = {};
  for (let i = 0; i <= 6; i++) {
    const existing = schedule?.days.find((d) => d.dayOfWeek === i);
    days[i] = existing
      ? { enabled: true, startTime: existing.startTime, endTime: existing.endTime }
      : { enabled: false, startTime: "08:00", endTime: "14:00" };
  }
  return days;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Builds the calendar grid cells for a given month, including the leading/
// trailing days from adjacent months so full weeks are shown.
function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, day: d.getDate(), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const [y, m, dd] = last.date.split("-").map(Number);
    const next = new Date(y, m - 1, dd + 1);
    cells.push({ date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`, day: next.getDate(), inMonth: false });
  }
  return cells;
}

// A small on/off switch — no separate UI primitive exists for this in the
// project yet, so it's kept local to this dialog.
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function ScheduleDialog({ open, onOpenChange, schedules, offDates, calendarSyncUrl }: ScheduleDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ---- Weekly schedule: list of saved templates + a create/edit form ----
  // formMode is null (closed), "create", or the id of the schedule being edited.
  const [formMode, setFormMode] = useState<"create" | number | null>(null);
  const [scheduleLabel, setScheduleLabel] = useState("");
  const [days, setDays] = useState<Record<number, DayState>>(daysFromSchedule(null));
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setFormMode(null);
      setDays(daysFromSchedule(null));
      setScheduleLabel("");
      setScheduleErrors({});
    }
  }, [open]);

  function updateDay(day: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  function openCreateForm() {
    setFormMode("create");
    setDays(daysFromSchedule(null));
    setScheduleLabel("");
    setScheduleErrors({});
  }

  function openEditForm(schedule: WorkSchedule) {
    setFormMode(schedule.id);
    setDays(daysFromSchedule(schedule));
    setScheduleLabel(schedule.label ?? "");
    setScheduleErrors({});
  }

  function closeForm() {
    setFormMode(null);
    setDays(daysFromSchedule(null));
    setScheduleLabel("");
    setScheduleErrors({});
  }

  function handleSaveSchedule() {
    setScheduleErrors({});
    const selectedDays = Object.entries(days)
      .filter(([, v]) => v.enabled)
      .map(([dayOfWeek, v]) => ({ dayOfWeek: Number(dayOfWeek), startTime: v.startTime, endTime: v.endTime }));

    startTransition(async () => {
      const result =
        typeof formMode === "number"
          ? await editWorkSchedule(formMode, { label: scheduleLabel, days: selectedDays })
          : await createWorkSchedule({ label: scheduleLabel, days: selectedDays });

      if (!result.success) {
        setScheduleErrors(result.errors as Record<string, string[]>);
        return;
      }

      if (typeof formMode === "number" && "clonedAndApplied" in result && result.clonedAndApplied) {
        toast.success("Schedule updated and applied — new hours are live from today. Past records are unchanged.");
      } else if (typeof formMode === "number") {
        toast.success("Schedule updated");
      } else {
        toast.success("Schedule saved. Click Apply on it whenever you want it to go live.");
      }
      closeForm();
      router.refresh();
    });
  }

  function handleApply(id: number) {
    setApplyingId(id);
    startTransition(async () => {
      const result = await applyWorkSchedule(id);
      setApplyingId(null);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not apply the schedule");
        return;
      }
      toast.success("Schedule applied — it's live now");
      router.refresh();
    });
  }

  function handleDeleteTemplate(id: number) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteWorkSchedule(id);
      setDeletingId(null);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not delete the schedule");
        return;
      }
      toast.success("Schedule deleted");
      router.refresh();
    });
  }

  function summarizeSchedule(schedule: WorkSchedule): string {
    const active = schedule.days.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    if (active.length === 0) return "No working days";
    return active.map((d) => `${WEEKDAY_LABELS[d.dayOfWeek].slice(0, 3)} ${formatTimeLabel(d.startTime)}\u2013${formatTimeLabel(d.endTime)}`).join(", ");
  }

  // ---- Holidays calendar state ----
  const today = todayString();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [syncOpen, setSyncOpen] = useState(false);
  const [icalUrl, setIcalUrl] = useState(calendarSyncUrl ?? "");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CalendarEvent[]>([]);
  const [isSyncing, startSyncing] = useTransition();

  const offDateSet = useMemo(() => new Set(offDates.map((d) => d.date)), [offDates]);
  const offDateByDate = useMemo(() => new Map(offDates.map((d) => [d.date, d])), [offDates]);
  const suggestionByDate = useMemo(() => new Map(suggestions.map((s) => [s.date, s])), [suggestions]);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Auto-fetch synced calendar suggestions as soon as the dialog opens, so
  // upcoming holidays just show up on the calendar — no manual "fetch" step.
  useEffect(() => {
    if (!open || !calendarSyncUrl) {
      setSuggestions([]);
      return;
    }
    previewCalendarEvents().then((result) => {
      if (result.success) setSuggestions(result.events);
    });
  }, [open, calendarSyncUrl]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  function handleDateClick(date: string) {
    const isOff = offDateSet.has(date);
    const suggestion = suggestionByDate.get(date);

    startTransition(async () => {
      const result =
        !isOff && suggestion
          ? await importOffDateFromCalendar(date, suggestion.label)
          : await toggleOffDate({ date });
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not update that date");
        return;
      }
      router.refresh();
    });
  }

  function handleSaveSyncUrl() {
    setSyncError(null);
    startSyncing(async () => {
      const result = await setCalendarSyncUrl({ icalUrl });
      if (!result.success) {
        setSyncError(result.errors.icalUrl?.[0] ?? result.errors.root?.[0] ?? "Could not save the link");
        return;
      }
      toast.success("Calendar linked — suggestions will appear on the calendar below");
      setSyncOpen(false);
      router.refresh();
    });
  }

  function handleRemoveSyncUrl() {
    startSyncing(async () => {
      const result = await clearCalendarSyncUrl();
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not remove the link");
        return;
      }
      setIcalUrl("");
      setSuggestions([]);
      toast.success("Calendar unlinked");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule & Holidays</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <TabsContent value="schedule" className="space-y-6 m-0">
          {/* ---- Weekly schedule ---- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Weekly Schedule</h3>
                <p className="text-xs text-muted-foreground">
                  Save as many schedules as you need, then hit Apply on the one you want live right now.
                </p>
              </div>
              {formMode === null && (
                <Button size="sm" variant="outline" onClick={openCreateForm}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              )}
            </div>

            {/* Saved schedules */}
            <div className="space-y-1.5">
              {schedules.length === 0 && formMode === null && (
                <p className="text-xs text-muted-foreground">No schedules saved yet. Click "New" to create one.</p>
              )}
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-2.5",
                    schedule.isActive && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{schedule.label || `Schedule #${schedule.id}`}</span>
                      {schedule.isActive && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                          <Check className="h-3 w-3 mr-0.5" /> Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{summarizeSchedule(schedule)}</p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEditForm(schedule)} disabled={isPending} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!schedule.isActive && (
                    <>
                      <Button size="sm" onClick={() => handleApply(schedule.id)} disabled={isPending}>
                        {applyingId === schedule.id ? "Applying..." : "Apply"}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(schedule.id)}
                        disabled={isPending}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Create / edit form */}
            {formMode !== null && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/20">
                <div className="space-y-1">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    value={scheduleLabel}
                    onChange={(e) => setScheduleLabel(e.target.value)}
                    placeholder="e.g. Summer Camp Hours"
                    className="h-8"
                  />
                </div>

                <div className="space-y-1.5">
                  {WEEKDAY_LABELS.map((label, day) => {
                    const state = days[day];
                    return (
                      <div
                        key={day}
                        className={cn("flex items-center gap-3 rounded-md border p-2.5 bg-background", !state.enabled && "bg-muted/30")}
                      >
                        <span className={cn("w-20 shrink-0 text-sm", state.enabled ? "font-medium" : "text-muted-foreground")}>
                          {label}
                        </span>

                        {state.enabled ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={state.startTime}
                              onChange={(e) => updateDay(day, { startTime: e.target.value })}
                              className="w-28 h-8"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <Input
                              type="time"
                              value={state.endTime}
                              onChange={(e) => updateDay(day, { endTime: e.target.value })}
                              className="w-28 h-8"
                            />
                          </div>
                        ) : (
                          <span className="flex-1 text-xs text-muted-foreground">Off</span>
                        )}

                        <Toggle checked={state.enabled} onChange={(v) => updateDay(day, { enabled: v })} />
                      </div>
                    );
                  })}
                </div>

                {scheduleErrors.days && <p className="text-xs text-destructive">{scheduleErrors.days[0]}</p>}
                {scheduleErrors.root && <p className="text-xs text-destructive">{scheduleErrors.root[0]}</p>}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveSchedule} disabled={isPending}>
                    {isPending ? "Saving..." : "Save Schedule"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={closeForm} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeof formMode === "number" &&
                  schedules.find((s) => s.id === formMode)?.effectiveFrom !== null
                    ? "This schedule has been applied before, so saving won't rewrite past records — it'll create an updated version and apply it from today if this one is currently active."
                    : "This just saves the schedule — it won't go live until you click Apply on it."}
                </p>
              </div>
            )}
          </section>

          </TabsContent>

          <TabsContent value="holidays" className="space-y-6 m-0">
          {/* ---- Holidays calendar ---- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Holidays</h3>
                <p className="text-xs text-muted-foreground">
                  Click a date to mark it off for everyone, regardless of the weekly schedule.
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSyncOpen((v) => !v)} title="Google Calendar sync">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            {syncOpen && (
              <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Paste a public Google Calendar iCal link — upcoming events show up as suggestions on the calendar
                  below (no login needed, read-only).
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={handleSaveSyncUrl} disabled={isSyncing || !icalUrl}>
                    <Link2 className="h-3.5 w-3.5 mr-1" />
                    Link
                  </Button>
                  {calendarSyncUrl && (
                    <Button size="sm" variant="ghost" onClick={handleRemoveSyncUrl} disabled={isSyncing}>
                      <Link2Off className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {syncError && <p className="text-xs text-destructive">{syncError}</p>}
                {calendarSyncUrl && !syncError && (
                  <p className="text-xs text-muted-foreground">
                    Linked. {suggestions.length > 0 ? `${suggestions.length} upcoming event(s) found.` : "No upcoming events found."}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
              {WEEKDAY_LABELS.map((l) => (
                <div key={l}>{l.slice(0, 2)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell) => {
                const isOff = offDateSet.has(cell.date);
                const entry = offDateByDate.get(cell.date);
                const suggestion = !isOff ? suggestionByDate.get(cell.date) : undefined;
                const isToday = cell.date === today;
                // Already non-working per the weekly schedule active on that date —
                // shown muted so it's clear it doesn't need a manual holiday too.
                const isWeeklyOff = !isOff && getDaySchedule(cell.date, schedules) === null;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={isPending || isWeeklyOff}
                    onClick={() => handleDateClick(cell.date)}
                    title={entry?.label ?? suggestion?.label ?? (isWeeklyOff ? "Weekly off day" : undefined)}
                    className={cn(
                      "relative h-10 rounded-md border text-xs transition-colors flex flex-col items-center justify-center gap-0.5",
                      !cell.inMonth && "opacity-30",
                      isOff
                        ? "bg-destructive/10 border-destructive text-destructive font-medium"
                        : isWeeklyOff
                        ? "bg-muted/60 text-muted-foreground border-dashed cursor-default"
                        : suggestion
                        ? "border-primary border-dashed hover:bg-muted"
                        : "hover:bg-muted",
                      isToday && !isOff && "border-primary"
                    )}
                  >
                    <span>{cell.day}</span>
                    {isOff && entry?.source === "google" && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] leading-none rounded bg-primary text-primary-foreground px-[3px]">
                        G
                      </span>
                    )}
                    {!isOff && suggestion && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-destructive/10 border border-destructive" /> Holiday
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted/60 border border-dashed border-muted-foreground/50" /> Weekly off
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-primary border-dashed" /> Suggested (click to add)
              </span>
            </div>

            {offDates.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                {offDates
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((d) => (
                    <div key={d.date} className="flex items-center justify-between border-b py-1 last:border-0">
                      <span>
                        {d.date} {d.label ? `— ${d.label}` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        {d.source === "google" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Synced
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleDateClick(d.date)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
          </TabsContent>
        </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
