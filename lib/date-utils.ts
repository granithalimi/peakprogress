/**
 * Date utility helpers for week-based workout tracking
 */

// Returns the Monday (00:00:00.000) for any given date
export function getStartOfWeek(d: Date | string): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Formats a Date into YYYY-MM-DD string
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parses YYYY-MM-DD into a local Date at midnight
export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

// Shift week by offset (+1 for next week, -1 for prev week)
export function shiftWeek(currentWeekStart: string, offsetWeeks: number): string {
  const date = parseISODate(currentWeekStart);
  date.setDate(date.getDate() + offsetWeeks * 7);
  return formatDateToISO(getStartOfWeek(date));
}

// Format week range for display (e.g., "Oct 14 – Oct 20, 2026")
export function formatWeekRange(weekStartStr: string): string {
  const start = parseISODate(weekStartStr);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}
