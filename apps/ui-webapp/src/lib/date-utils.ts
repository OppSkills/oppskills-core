/**
 * Shared utilities for handling Indian Standard Time (IST, UTC+5:30) consistently across the app.
 * This ensures that both organizers (dashboard) and participants (public pages) see the same schedule.
 */

export type ISTFormatType =
  | "full_date" // EEEE, d MMMM yyyy (e.g. Wednesday, 8 April 2026)
  | "date" // MMMM d, yyyy (e.g. April 8, 2026)
  | "short_month" // MMM (e.g. Apr)
  | "day" // d (e.g. 8)
  | "time" // h:mm a (e.g. 9:00 AM)
  | "datetime"; // MMMM d, yyyy h:mm a (e.g. April 8, 2026 9:00 AM)

interface ISTOptions {
  formatType?: ISTFormatType;
  showSuffix?: boolean;
}

/**
 * Formats a Date object or ISO string specifically into IST (Asia/Kolkata).
 */
export function formatToIST(
  date: Date | string | number | undefined,
  options: ISTOptions = {},
): string {
  if (!date) return "";
  const { formatType = "datetime", showSuffix = true } = options;

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const formatPresets: Record<ISTFormatType, Intl.DateTimeFormatOptions> = {
    full_date: {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    date: { month: "long", day: "numeric", year: "numeric" },
    short_month: { month: "short" },
    day: { day: "numeric" },
    time: { hour: "numeric", minute: "2-digit", hour12: true },
    datetime: {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  };

  const formatter = new Intl.DateTimeFormat("en-IN", {
    ...formatPresets[formatType],
    timeZone: "Asia/Kolkata",
  });

  let result = formatter.format(d);

  // Intl sometimes uses commas differently between browsers, so we normalize
  // For 'time', we just want the time part:
  if (formatType === "time") {
    // en-IN might return "9:00 am" or "9:00 AM", normalize to uppercase
    result = result.toUpperCase();
  }

  if (showSuffix && (formatType === "time" || formatType === "datetime")) {
    return `${result} (IST)`;
  }

  return result;
}

/**
 * Checks if two dates fall on the same day within the IST timezone.
 */
export function isSameDayInIST(d1: Date | string, d2: Date | string): boolean {
  if (!d1 || !d2) return false;

  const date1 = new Date(d1);
  const date2 = new Date(d2);

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };

  const formatter = new Intl.DateTimeFormat("en-IN", formatOptions);
  return formatter.format(date1) === formatter.format(date2);
}
