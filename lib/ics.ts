// Minimal, dependency-free parser for public Google Calendar iCal (.ics)
// feeds. Only reads what the off-days calendar needs — event title + date —
// and deliberately ignores recurrence rules, timezones, and anything else;
// good enough for "show me the vacations coming up on the school calendar".

export type CalendarEvent = {
  date: string; // "YYYY-MM-DD"
  label: string;
};

function unfoldLines(raw: string): string[] {
  // iCal "folds" long lines by breaking them and continuing with a leading
  // space/tab on the next line — undo that before parsing line by line.
  const lines = raw.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseDateValue(value: string): string | null {
  // Handles "YYYYMMDD" (all-day) and "YYYYMMDDTHHMMSS[Z]" (timed) forms —
  // either way we only care about the calendar date.
  const match = value.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m}-${d}`;
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

// Parses raw .ics text into a flat list of {date, label} events. If an event
// has no DTSTART it's skipped; recurring events (RRULE) are only represented
// by their first occurrence since expanding recurrence properly needs a real
// RRULE library, which is overkill for a "what's coming up" preview.
export function parseIcs(raw: string): CalendarEvent[] {
  const lines = unfoldLines(raw);
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let currentDate: string | null = null;
  let currentLabel = "";

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      currentDate = null;
      currentLabel = "";
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (inEvent && currentDate) {
        events.push({ date: currentDate, label: currentLabel || "Untitled event" });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);

    if (key.startsWith("DTSTART")) {
      currentDate = parseDateValue(value);
    } else if (key.startsWith("SUMMARY")) {
      currentLabel = unescapeText(value);
    }
  }

  return events;
}

// Fetches and parses a public iCal feed URL. Google Calendar's "Secret
// address in iCal format" (or any public .ics URL) both work here since this
// is a plain GET + text parse, no OAuth involved.
export async function fetchCalendarEvents(icalUrl: string): Promise<CalendarEvent[]> {
  const res = await fetch(icalUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not fetch calendar (HTTP ${res.status})`);
  }
  const text = await res.text();
  return parseIcs(text);
}

// Only events from today onward, deduped by date (keeps the first title seen
// per date), sorted chronologically, capped to a sane count for a preview list.
export function upcomingCalendarEvents(events: CalendarEvent[], fromDate: string, limit = 30): CalendarEvent[] {
  const seen = new Set<string>();
  const result: CalendarEvent[] = [];
  for (const e of events.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    if (e.date < fromDate) continue;
    if (seen.has(e.date)) continue;
    seen.add(e.date);
    result.push(e);
    if (result.length >= limit) break;
  }
  return result;
}
