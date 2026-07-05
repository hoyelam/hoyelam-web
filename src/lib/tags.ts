export function formatDate(value?: Date) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function plural(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function formatRelativeDate(value?: Date, now = new Date()) {
  if (!value) return "";

  const dayDifference = Math.round(
    (startOfDay(now).getTime() - startOfDay(value).getTime()) / 86_400_000,
  );

  if (dayDifference < 0) return "";
  if (dayDifference === 0) return "today";
  if (dayDifference === 1) return "yesterday";
  if (dayDifference < 7) return plural(dayDifference, "day");
  if (dayDifference < 30) return plural(Math.floor(dayDifference / 7), "week");

  const monthDifference =
    (now.getFullYear() - value.getFullYear()) * 12 +
    now.getMonth() -
    value.getMonth() -
    (now.getDate() < value.getDate() ? 1 : 0);

  if (monthDifference < 12) return plural(Math.max(1, monthDifference), "month");

  const yearDifference =
    now.getFullYear() -
    value.getFullYear() -
    (now.getMonth() < value.getMonth() ||
    (now.getMonth() === value.getMonth() && now.getDate() < value.getDate())
      ? 1
      : 0);

  return plural(Math.max(1, yearDifference), "year");
}
