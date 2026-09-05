import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchHolidays } from '../api/my-work';

// Convert date components to ISO format (YYYY-MM-DD)
function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Get today's date in ISO format
function todayISO(): string {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth(), n.getDate());
}

// Count leave days, excluding weekends and holidays
function countLeaveDays(
  from: string,
  to: string,
  halfDay: boolean,
  holidays: Record<string, string>
): number {
  if (!from || !to) return halfDay ? 0.5 : 0;
  const a = new Date(from + 'T12:00:00');
  const b = new Date(to + 'T12:00:00');
  let days = 0;
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // Skip weekends
    const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
    if (holidays[iso]) continue; // Skip holidays
    days += 1;
  }
  if (halfDay && days >= 1) return Math.max(0.5, days - 0.5);
  return days;
}

export function useLeaveCalculations() {
  // Fetch holidays from the mock backend
  const { data: holidays = {} } = useQuery({
    queryKey: queryKeys.myWork.holidays.list(),
    queryFn: fetchHolidays,
  });

  return {
    holidays,
    toISO,
    todayISO,
    countLeaveDays: (from: string, to: string, halfDay: boolean) =>
      countLeaveDays(from, to, halfDay, holidays),
  };
}