/**
 * COBOL-X Standard Library — Date and Time Utilities
 *
 * Provides COBOL-style date/time functions that mirror COBOL's
 * FUNCTION CURRENT-DATE, FUNCTION DATE-OF-INTEGER, and related
 * date arithmetic operations. Dates follow ISO 8601 format (YYYY-MM-DD)
 * internally, with COBOL display format support.
 *
 * @module date_utils
 */

/** Valid date unit values for arithmetic operations. */
type DateUnit = "DAYS" | "MONTHS" | "YEARS" | "HOURS" | "MINUTES" | "SECONDS";

/**
 * CURRENT-DATE — Returns the current date and time as a COBOL-style formatted string.
 *
 * COBOL equivalent: FUNCTION CURRENT-DATE.
 * Returns a string in the format "YYYYMMDDHHMMSSsss" (21 characters),
 * matching the COBOL standard format where:
 *   - YYYY = 4-digit year
 *   - MM   = 2-digit month (01-12)
 *   - DD   = 2-digit day (01-31)
 *   - HH   = 2-digit hour (00-23)
 *   - MM   = 2-digit minute (00-59)
 *   - SS   = 2-digit second (00-59)
 *   - sss  = 3-digit milliseconds
 *
 * @returns The current date/time as a 21-character COBOL-formatted string.
 *
 * @example
 * CURRENT_DATE()  // => "20250113153045123"
 */
export function CURRENT_DATE(): string {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const millis = now.getMilliseconds().toString().padStart(3, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}${millis}`;
}

/**
 * CURRENT-DATE-ISO — Returns the current date and time in ISO 8601 format.
 *
 * More modern alternative to CURRENT-DATE, returns "YYYY-MM-DDTHH:MM:SS.sssZ".
 *
 * @returns ISO 8601 formatted date/time string.
 *
 * @example
 * CURRENT_DATE_ISO()  // => "2025-01-13T15:30:45.123Z"
 */
export function CURRENT_DATE_ISO(): string {
  return new Date().toISOString();
}

/**
 * DATE-ADD — Adds a specified amount of time to a date string.
 *
 * COBOL equivalent: COMPUTE new-date = old-date + duration.
 * Supports adding days, months, years, hours, minutes, and seconds.
 *
 * @param dateStr - The date string (ISO 8601 format, e.g., "2025-01-13" or "2025-01-13T10:00:00Z").
 * @param amount - The amount to add (must be positive; use negative to subtract).
 * @param unit - The unit of time: "DAYS", "MONTHS", "YEARS", "HOURS", "MINUTES", "SECONDS".
 * @returns The resulting date in ISO 8601 format.
 * @throws {Error} If the date string is invalid, amount is not a number, or unit is invalid.
 *
 * @example
 * DATE_ADD("2025-01-13", 30, "DAYS")      // => "2025-02-12T00:00:00.000Z"
 * DATE_ADD("2025-01-13", 1, "MONTHS")     // => "2025-02-13T00:00:00.000Z"
 * DATE_ADD("2025-01-13", -1, "YEARS")     // => "2024-01-13T00:00:00.000Z"
 */
export function DATE_ADD(dateStr: string, amount: number, unit: DateUnit): string {
  if (typeof dateStr !== "string") {
    throw new Error(`DATE-ADD: expected PIC X for date, received ${typeof dateStr}`);
  }
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    throw new Error(`DATE-ADD: amount must be a whole number, received ${amount}`);
  }
  const validUnits: DateUnit[] = ["DAYS", "MONTHS", "YEARS", "HOURS", "MINUTES", "SECONDS"];
  if (!validUnits.includes(unit)) {
    throw new Error(`DATE-ADD: invalid unit '${unit}', expected one of ${validUnits.join(", ")}`);
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`DATE-ADD: invalid date string '${dateStr}'`);
  }

  switch (unit) {
    case "DAYS":
      date.setDate(date.getDate() + amount);
      break;
    case "MONTHS":
      date.setMonth(date.getMonth() + amount);
      break;
    case "YEARS":
      date.setFullYear(date.getFullYear() + amount);
      break;
    case "HOURS":
      date.setHours(date.getHours() + amount);
      break;
    case "MINUTES":
      date.setMinutes(date.getMinutes() + amount);
      break;
    case "SECONDS":
      date.setSeconds(date.getSeconds() + amount);
      break;
  }

  return date.toISOString();
}

/**
 * DATE-DIFF — Computes the difference between two dates in the specified unit.
 *
 * COBOL equivalent: COMPUTE days = FUNCTION INTEGER-OF-DATE(end) - FUNCTION INTEGER-OF-DATE(start).
 *
 * @param startDateStr - The start date string (ISO 8601 or COBOL format "YYYYMMDD").
 * @param endDateStr - The end date string (ISO 8601 or COBOL format "YYYYMMDD").
 * @param unit - The unit for the result: "DAYS" (default), "MONTHS", "YEARS", "HOURS", "MINUTES", "SECONDS".
 * @returns The difference as a whole number (truncated toward zero).
 * @throws {Error} If date strings are invalid, or if using MONTHS/YEARS with time-only dates.
 *
 * @example
 * DATE_DIFF("2025-01-01", "2025-01-31", "DAYS")   // => 30
 * DATE_DIFF("2025-01-01", "2026-01-01", "YEARS")  // => 1
 * DATE_DIFF("2025-01-13T10:00", "2025-01-13T12:30", "HOURS")  // => 2
 */
export function DATE_DIFF(
  startDateStr: string,
  endDateStr: string,
  unit: DateUnit = "DAYS"
): number {
  if (typeof startDateStr !== "string" || typeof endDateStr !== "string") {
    throw new Error("DATE-DIFF: both date arguments must be PIC X (strings)");
  }
  const validUnits: DateUnit[] = ["DAYS", "MONTHS", "YEARS", "HOURS", "MINUTES", "SECONDS"];
  if (!validUnits.includes(unit)) {
    throw new Error(`DATE-DIFF: invalid unit '${unit}', expected one of ${validUnits.join(", ")}`);
  }

  // Support COBOL format "YYYYMMDD" by converting to ISO
  const normalizeDate = (s: string): string => {
    if (/^\d{8}$/.test(s)) {
      return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
    }
    return s;
  };

  const start = new Date(normalizeDate(startDateStr));
  const end = new Date(normalizeDate(endDateStr));

  if (Number.isNaN(start.getTime())) {
    throw new Error(`DATE-DIFF: invalid start date '${startDateStr}'`);
  }
  if (Number.isNaN(end.getTime())) {
    throw new Error(`DATE-DIFF: invalid end date '${endDateStr}'`);
  }

  const diffMs = end.getTime() - start.getTime();

  switch (unit) {
    case "DAYS":
      return Math.trunc(diffMs / (1000 * 60 * 60 * 24));
    case "HOURS":
      return Math.trunc(diffMs / (1000 * 60 * 60));
    case "MINUTES":
      return Math.trunc(diffMs / (1000 * 60));
    case "SECONDS":
      return Math.trunc(diffMs / 1000);
    case "MONTHS": {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return months;
    }
    case "YEARS": {
      return end.getFullYear() - start.getFullYear();
    }
    default:
      return Math.trunc(diffMs / (1000 * 60 * 60 * 24));
  }
}

/**
 * FORMAT-DATE — Formats a date string into a specified display format.
 *
 * COBOL equivalent: MOVE FUNCTION CURRENT-DATE TO WS-DATE-DISPLAY with editing.
 *
 * Supported format tokens:
 *   YYYY - 4-digit year
 *   YY   - 2-digit year
 *   MM   - 2-digit month (01-12)
 *   DD   - 2-digit day (01-31)
 *   HH   - 2-digit hour (00-23)
 *   MM   - 2-digit minute (00-59)
 *   SS   - 2-digit second (00-59)
 *   MON  - Abbreviated month name (Jan, Feb, etc.)
 *   DAY  - Abbreviated day name (Mon, Tue, etc.)
 *
 * Note: Use "MI" for minutes to avoid ambiguity with month "MM".
 *
 * @param dateStr - The date string to format (ISO 8601 or COBOL "YYYYMMDD" format).
 * @param format - The format string with tokens.
 * @returns The formatted date string.
 * @throws {Error} If the date string is invalid.
 *
 * @example
 * FORMAT_DATE("2025-01-13", "DD/MM/YYYY")              // => "13/01/2025"
 * FORMAT_DATE("2025-01-13", "YYYY-MM-DD")              // => "2025-01-13"
 * FORMAT_DATE("20250113", "MON DD, YYYY")              // => "Jan 13, 2025"
 * FORMAT_DATE("2025-01-13T15:30:00", "HH:MI:SS")       // => "15:30:00"
 */
export function FORMAT_DATE(dateStr: string, format: string): string {
  if (typeof dateStr !== "string") {
    throw new Error(`FORMAT-DATE: expected PIC X for date, received ${typeof dateStr}`);
  }
  if (typeof format !== "string") {
    throw new Error(`FORMAT-DATE: expected PIC X for format, received ${typeof format}`);
  }

  // Support COBOL format "YYYYMMDD" by converting to ISO
  let normalizedDateStr = dateStr;
  if (/^\d{8}$/.test(dateStr)) {
    normalizedDateStr = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }

  const date = new Date(normalizedDateStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`FORMAT-DATE: invalid date string '${dateStr}'`);
  }

  const abbreviatedMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const abbreviatedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = date.getFullYear().toString();
  const yearShort = year.substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const monthName = abbreviatedMonths[date.getMonth()];
  const dayName = abbreviatedDays[date.getDay()];

  return format
    .replace(/YYYY/g, year)
    .replace(/YY/g, yearShort)
    .replace(/MON/g, monthName)
    .replace(/DAY/g, dayName)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hours)
    .replace(/MI/g, minutes)
    .replace(/SS/g, seconds);
}

/**
 * PARSE-DATE — Parses a date string from a known format into ISO 8601.
 *
 * Reverse of FORMAT-DATE. Supports common COBOL date display formats.
 *
 * @param dateStr - The formatted date string.
 * @param format - The format that describes the input string's layout.
 * @returns ISO 8601 formatted date string.
 * @throws {Error} If the date cannot be parsed with the given format.
 *
 * @example
 * PARSE_DATE("13/01/2025", "DD/MM/YYYY")  // => "2025-01-13T00:00:00.000Z"
 * PARSE_DATE("2025-01-13", "YYYY-MM-DD")  // => "2025-01-13T00:00:00.000Z"
 */
export function PARSE_DATE(dateStr: string, format: string): string {
  if (typeof dateStr !== "string") {
    throw new Error(`PARSE-DATE: expected PIC X for date, received ${typeof dateStr}`);
  }
  if (typeof format !== "string") {
    throw new Error(`PARSE-DATE: expected PIC X for format, received ${typeof format}`);
  }

  // Build a regex pattern from the format string
  const tokenMap: [RegExp, string][] = [
    [/YYYY/g, "(\\d{4})"],
    [/YY/g, "(\\d{2})"],
    [/MON/g, "(\\w{3})"],
    [/DAY/g, "(\\w{3})"],
    [/MM/g, "(\\d{2})"],
    [/DD/g, "(\\d{2})"],
    [/HH/g, "(\\d{2})"],
    [/MI/g, "(\\d{2})"],
    [/SS/g, "(\\d{2})"],
  ];

  let regexPattern = format;
  const tokenNames: string[] = [];

  for (const [token, group] of tokenMap) {
    const matches = regexPattern.match(token);
    if (matches && matches.length > 0) {
      const tokenName = matches[0];
      regexPattern = regexPattern.replace(token, group);
      tokenNames.push(tokenName);
    }
  }

  // Escape remaining special characters in the format
  regexPattern = regexPattern.replace(/[\/\-.: ]/g, (ch) => `\\${ch}`);

  const match = dateStr.match(new RegExp(`^${regexPattern}$`));
  if (!match) {
    throw new Error(`PARSE-DATE: date '${dateStr}' does not match format '${format}'`);
  }

  const parts: Record<string, string> = {};
  for (let i = 0; i < tokenNames.length; i++) {
    parts[tokenNames[i]] = match[i + 1];
  }

  // Map month names to numbers
  const monthNames: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  let year = parts["YYYY"] || `20${parts["YY"] || "00"}`;
  let month = parts["MON"] ? monthNames[parts["MON"]] : parts["MM"] || "01";
  const day = parts["DD"] || "01";
  const hours = parts["HH"] || "00";
  const minutes = parts["MI"] || "00";
  const seconds = parts["SS"] || "00";

  const isoStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`PARSE-DATE: produced invalid date from '${dateStr}' with format '${format}'`);
  }

  return parsed.toISOString();
}

/**
 * DAY-OF-WEEK — Returns the day of the week for a given date.
 *
 * COBOL equivalent: FUNCTION DAY-OF-WEEK.
 *
 * @param dateStr - The date string (ISO 8601 or COBOL "YYYYMMDD" format).
 * @returns Day number: 1=Monday through 7=Sunday (ISO standard).
 * @throws {Error} If the date string is invalid.
 *
 * @example
 * DAY_OF_WEEK("2025-01-13")  // => 1 (Monday)
 * DAY_OF_WEEK("2025-01-19")  // => 7 (Sunday)
 */
export function DAY_OF_WEEK(dateStr: string): number {
  if (typeof dateStr !== "string") {
    throw new Error(`DAY-OF-WEEK: expected PIC X, received ${typeof dateStr}`);
  }
  let normalized = dateStr;
  if (/^\d{8}$/.test(dateStr)) {
    normalized = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`DAY-OF-WEEK: invalid date string '${dateStr}'`);
  }
  // JavaScript getDay() returns 0=Sunday, convert to ISO 1=Monday
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * IS-LEAP-YEAR — Determines whether a given year is a leap year.
 *
 * COBOL equivalent: manual calculation using DIVIDE REMAINDER.
 *
 * @param year - The year to check (e.g., 2024, 2025).
 * @returns 1 if leap year, 0 if not.
 * @throws {Error} If year is not a valid integer.
 *
 * @example
 * IS_LEAP_YEAR(2024)  // => 1
 * IS_LEAP_YEAR(2025)  // => 0
 * IS_LEAP_YEAR(2000)  // => 1
 * IS_LEAP_YEAR(1900)  // => 0
 */
export function IS_LEAP_YEAR(year: number): 0 | 1 {
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new Error(`IS-LEAP-YEAR: expected whole number for year, received ${year}`);
  }
  // Divisible by 4, except centuries unless divisible by 400
  if (year % 4 !== 0) return 0;
  if (year % 100 !== 0) return 1;
  if (year % 400 === 0) return 1;
  return 0;
}