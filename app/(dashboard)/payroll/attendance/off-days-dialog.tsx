"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  toggleOffDate,
  setCalendarSyncUrl,
  clearCalendarSyncUrl,
  previewCalendarEvents,
  importOffDateFromCalendar,
} from "./attendance-actions";
import { WEEKDAY_LABELS, todayString } from "./attendance-helpers";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, RefreshCw, Check, Link2Off } from "lucide-react";
import type { CalendarEvent } from "@/lib/ics";

interface OffDatesEntry {
  date: string;
  label: string | null;
  source: string;
}

interface OffDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOffDays: number[];
  offDates: OffDatesEntry[];
  calendarSyncUrl: string | null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Builds the calendar grid cells for a given month, including the leading/
// trailing days from adjacent months so full weeks are shown.
function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sunday
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

export function OffDaysDialog({ open, onOpenChange, currentOffDays, offDates, calendarSyncUrl }: OffDaysDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set(currentOffDays));
  const [isPending, startTransition] = useTransition();

  const today = todayString();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1); // 0-indexed

  const [icalUrl, setIcalUrl] = useState(calendarSyncUrl ?? "");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSyncing, startSyncing] = useTransition();

  const offDateSet = useMemo(() => new Set(offDates.map((d) => d.date)), [offDates]);
  const offDateByDate = useMemo(() => new Map(offDates.map((d) => [d.date, d])), [offDates]);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function toggleWeekday(day: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  // Weekly off days are determined by which days have entries in the active
  // Work Schedule (days with no schedule entry are automatically non-working).
  // There is no separate "save weekly off days" action — use the Schedule tab.
  function handleSaveWeekly() {
    toast.info("Configure weekly off days in the Work Schedule (which days have shift hours). Days with no entry are automatically non-working.");
  }

  function handleToggleDate(date: string) {
    startTransition(async () => {
      const result = await toggleOffDate({ date });
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not update that date");
        return;
      }
      router.refresh();
    });
  }

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

  function handleSaveSyncUrl() {
    setSyncError(null);
    startSyncing(async () => {
      const result = await setCalendarSyncUrl({ icalUrl });
      if (!result.success) {
        setSyncError(result.errors.icalUrl?.[0] ?? result.errors.root?.[0] ?? "Could not save the link");
        return;
      }
      toast.success("Calendar linked");
      router.refresh();
      await handleFetchPreview();
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
      setPreviewEvents(null);
      toast.success("Calendar unlinked");
      router.refresh();
    });
  }

  async function handleFetchPreview() {
    setPreviewError(null);
    const result = await previewCalendarEvents();
    if (!result.success) {
      setPreviewError(result.error);
      setPreviewEvents(null);
      return;
    }
    setPreviewEvents(result.events);
  }

  function handleImportEvent(date: string, label: string) {
    startTransition(async () => {
      const result = await importOffDateFromCalendar(date, label);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not import that date");
        return;
      }
      toast.success(`${date} marked off`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Off Days & Vacations</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="flex flex-col">
          <TabsList>
            <TabsTrigger value="weekly">Weekly Off Days</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="sync">Google Calendar Sync</TabsTrigger>
          </TabsList>

          {/* ---- Weekly recurring off days (e.g. every Sunday) ---- */}
          <TabsContent value="weekly" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Selected weekdays are excluded from absent/leave calculations for every employee, every week.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                    selected.has(day) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <DialogFooter className="px-0">
              <Button onClick={handleSaveWeekly} disabled={isPending}>
                {isPending ? "Saving..." : "Save Weekly Off Days"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ---- Specific-date off days on a real calendar ---- */}
          <TabsContent value="calendar" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Click any date to mark it off (holiday/vacation) for everyone. Click again to undo. Dates pulled in
              from your synced Google Calendar are marked <Badge variant="secondary" className="align-middle">G</Badge>.
            </p>

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
                const isToday = cell.date === today;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleDate(cell.date)}
                    title={entry?.label ?? undefined}
                    className={cn(
                      "relative h-10 rounded-md border text-xs transition-colors flex flex-col items-center justify-center gap-0.5",
                      !cell.inMonth && "opacity-30",
                      isOff ? "bg-destructive/10 border-destructive text-destructive font-medium" : "hover:bg-muted",
                      isToday && !isOff && "border-primary"
                    )}
                  >
                    <span>{cell.day}</span>
                    {isOff && entry?.source === "google" && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] leading-none rounded bg-primary text-primary-foreground px-[3px]">
                        G
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {offDates.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                <p className="font-medium text-foreground">Marked off dates</p>
                {offDates
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((d) => (
                    <div key={d.date} className="flex items-center justify-between border-b py-1 last:border-0">
                      <span>
                        {d.date} {d.label ? `— ${d.label}` : ""}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleToggleDate(d.date)}>
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* ---- Google Calendar (public iCal link) sync ---- */}
          <TabsContent value="sync" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Paste your Google Calendar&apos;s public iCal link (Calendar Settings → &quot;Secret address in iCal
              format&quot;, or any public .ics URL). No Google login needed — read-only.
            </p>

            <div className="space-y-1.5">
              <Label>Calendar iCal URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                />
                <Button onClick={handleSaveSyncUrl} disabled={isSyncing || !icalUrl}>
                  {isSyncing ? "Saving..." : "Save"}
                </Button>
              </div>
              {syncError && <p className="text-sm text-destructive">{syncError}</p>}
            </div>

            {calendarSyncUrl && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleFetchPreview} disabled={isSyncing}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Fetch upcoming events
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRemoveSyncUrl} disabled={isSyncing}>
                  <Link2Off className="h-3.5 w-3.5 mr-1" />
                  Unlink
                </Button>
              </div>
            )}

            {previewError && <p className="text-sm text-destructive">{previewError}</p>}

            {previewEvents && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {previewEvents.filter((e) => e.date >= today).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming events found on this calendar.</p>
                ) : (
                  previewEvents
                    .filter((e) => e.date >= today)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((e, i) => {
                      const already = offDateSet.has(e.date);
                      return (
                        <div key={`${e.date}-${i}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <span>
                            <span className="text-muted-foreground">{e.date}</span> — {e.label}
                          </span>
                          <Button
                            size="sm"
                            variant={already ? "secondary" : "outline"}
                            disabled={already || isPending}
                            onClick={() => handleImportEvent(e.date, e.label)}
                          >
                            {already ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" /> Off
                              </>
                            ) : (
                              "Mark off"
                            )}
                          </Button>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </TabsContent>
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
