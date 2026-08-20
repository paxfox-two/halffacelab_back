// startDate may be a plain "YYYY-MM-DD" (from a <input type="date"> value)
// or a full ISO datetime string (as returned by the API for a @db.Date
// column) — `new Date(...)` parses both correctly, so no manual
// concatenation here.
export function dayIndexFor(startDate: string, date = new Date()): number {
  const start = new Date(startDate);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
