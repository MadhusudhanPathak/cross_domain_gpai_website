export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let d = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 86400000);
  }
  return out;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const wd = WEEKDAYS[d.getUTCDay()];
  const day = d.getUTCDate();
  const mo = MONTHS[d.getUTCMonth()];
  return `${wd} ${day} ${mo}`;
}

export function isWeekend(iso: string): boolean {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
