/**
 * Shared date formatting utilities.
 */

/**
 * Formats a Date object or ISO string into a localized string.
 * Example: "Jan 1, 2024"
 *
 * @param dateString - The date to format
 * @param fallback - The string to return if the date is invalid or undefined
 * @returns Formatted date string
 */
export const formatDate = (
  dateString?: Date | string | null,
  fallback = "N/A",
): string => {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch (error) {
    return fallback;
  }
};

/**
 * Formats a Date object or ISO string into a localized string with time.
 * Example: "01 Jan 2024, 02:30 PM"
 *
 * @param dateString - The date to format
 * @param fallback - The string to return if the date is invalid or undefined
 * @returns Formatted date string with time
 */
export const formatDateTime = (
  dateString?: Date | string | null,
  fallback = "N/A",
): string => {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    return fallback;
  }
};
