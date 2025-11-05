/**
 * Date utility functions for the app
 */

/**
 * Format a date string to YYYY-MM-DD format
 * Handles both ISO strings and date strings
 */
export const formatDateToYMD = (dateStr: string): string => {
  if (!dateStr) return "";

  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Parse the date
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr; // Return original if invalid
  }

  // Format to YYYY-MM-DD in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * This avoids timezone conversion issues
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  // If it's in YYYY-MM-DD format, parse it as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Otherwise use standard parsing
  return new Date(dateStr);
};

/**
 * Calculate days between two dates
 * Handles timezone properly by comparing dates at midnight
 */
export const calculateDaysBetween = (startDate: Date, endDate: Date = new Date()): number => {
  // Reset both dates to midnight in local timezone
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  return diffMs > 0 ? Math.floor(diffMs / msPerDay) : 0;
};

/**
 * Calculate days together from anniversary date
 * Returns 0 if the date is in the future
 */
export const calculateDaysTogether = (anniversaryDate: Date | string): number => {
  const anniversary = typeof anniversaryDate === 'string'
    ? parseLocalDate(anniversaryDate)
    : anniversaryDate;

  const today = new Date();

  // If anniversary is in the future, return 0
  if (anniversary > today) return 0;

  // Calculate days and add 1 (day 1 is the anniversary day itself)
  const days = calculateDaysBetween(anniversary, today);
  return days + 1;
};

/**
 * Format a number with locale-appropriate thousands separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format days with proper singular/plural
 */
export const formatDaysText = (days: number): string => {
  if (days === 0) return "Days together";
  if (days === 1) return "1 day together";
  return `${formatNumber(days)} days together`;
};