const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Every `YYYY-MM-DD` date from `from` to `to`, inclusive, computed in UTC. Empty for invalid input. */
export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const end = parseIsoDate(to).getTime();
  for (let t = parseIsoDate(from).getTime(); t <= end; t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Short label such as "Wed 1 Oct". */
export function formatDateLabel(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function isWeekend(iso: string): boolean {
  const day = parseIsoDate(iso).getUTCDay();
  return day === 0 || day === 6;
}

/** The visitor's IANA time zone, or "UTC" when unavailable. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
