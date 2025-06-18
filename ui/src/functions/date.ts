const dateFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

const dateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

const timeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

export function formatDateString(
  date: string,
  format: Intl.DateTimeFormatOptions = dateFormatOptions,
): string {
  return new Date(date).toLocaleDateString(undefined, format);
}
export function toLocaleDateString(date: string): string {
  return formatDateString(date);
}

export function toLocaleDateTimeString(date: string): string {
  return formatDateString(date, dateTimeFormatOptions);
}
export function toLocaleTimeString(date: string): string {
  return formatDateString(date, timeFormatOptions);
}

export function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
export function isSameDayString(d1: string, d2: string) {
  return d1.substring(0, 10) == d2.substring(0, 10);
}
