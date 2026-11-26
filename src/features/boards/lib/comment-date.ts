import { addDays, localDay } from "@/features/boards/lib/card-due";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatCommentDate(instant: Date, today: string | null) {
  const time = `${instant.getHours()}h${pad(instant.getMinutes())}`;
  const day = localDay(instant);
  if (day === today) {
    return `hoje, ${time}`;
  }
  if (today !== null && day === addDays(today, -1)) {
    return `ontem, ${time}`;
  }
  const date = `${pad(instant.getDate())}/${pad(instant.getMonth() + 1)}`;
  if (today !== null && day.slice(0, 4) === today.slice(0, 4)) {
    return `${date}, ${time}`;
  }
  return `${date}/${instant.getFullYear()}, ${time}`;
}
