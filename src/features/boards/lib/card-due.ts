const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const DUE_SOON_DAYS = 7;

export type DueStatus = "done" | "overdue" | "today" | "upcoming";

export type DueCard = { dueOn: string | null; completed: boolean };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDay(day: string) {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return { year, month, date };
}

export function localDay(now: Date) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(day: string, days: number) {
  const { year, month, date } = parseDay(day);
  const shifted = new Date(Date.UTC(year, month - 1, date + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function dueStatus(
  card: DueCard,
  today: string | null,
): DueStatus | null {
  if (card.completed) {
    return "done";
  }
  if (card.dueOn === null) {
    return null;
  }
  if (today === null || card.dueOn > today) {
    return "upcoming";
  }
  return card.dueOn === today ? "today" : "overdue";
}

export function formatDueDay(dueOn: string, today: string | null) {
  const { year, month, date } = parseDay(dueOn);
  const label = `${date} ${MONTHS[month - 1] ?? ""}`;
  return today === null || parseDay(today).year === year
    ? label
    : `${label} ${year}`;
}

export function isOverdue(card: DueCard, today: string) {
  return dueStatus(card, today) === "overdue";
}

export function isDueThisWeek(card: DueCard, today: string) {
  return (
    !card.completed &&
    card.dueOn !== null &&
    card.dueOn >= today &&
    card.dueOn <= addDays(today, DUE_SOON_DAYS)
  );
}
