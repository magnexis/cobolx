/**
 * COBOL-X Standard Library — String Handling Built-in Functions
 *
 * Provides COBOL-style string manipulation utilities that mirror
 * classic COBOL STRING/UNSTRING operations while offering modern
 * conveniences. All functions accept and return PIC X (string) values
 * and follow COBOL naming conventions.
 *
 * @module string_utils
 */

/**
 * STRING-REVERSE — Reverses the characters in the given string.
 *
 * COBOL equivalent: Manual INSPECT TALLYING/REPLACING loop.
 *
 * @param value - The alphanumeric string to reverse.
 * @returns The reversed string.
 * @throws {Error} If the input is not a string.
 *
 * @example
 * STRING_REVERSE("HELLO WORLD")  // => "DLROW OLLEH"
 */
export function STRING_REVERSE(value: string): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-REVERSE: expected PIC X, received ${typeof value}`);
  }
  return value.split("").reverse().join("");
}

/**
 * STRING-UPPER — Converts all alphabetic characters in the string to uppercase.
 *
 * COBOL equivalent: FUNCTION UPPER-CASE.
 *
 * @param value - The alphanumeric string to convert.
 * @returns The uppercase version of the string.
 * @throws {Error} If the input is not a string.
 *
 * @example
 * STRING_UPPER("Hello World")  // => "HELLO WORLD"
 */
export function STRING_UPPER(value: string): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-UPPER: expected PIC X, received ${typeof value}`);
  }
  return value.toUpperCase();
}

/**
 * STRING-LOWER — Converts all alphabetic characters in the string to lowercase.
 *
 * COBOL equivalent: FUNCTION LOWER-CASE.
 *
 * @param value - The alphanumeric string to convert.
 * @returns The lowercase version of the string.
 * @throws {Error} If the input is not a string.
 *
 * @example
 * STRING_LOWER("Hello World")  // => "hello world"
 */
export function STRING_LOWER(value: string): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-LOWER: expected PIC X, received ${typeof value}`);
  }
  return value.toLowerCase();
}

/**
 * STRING-TRIM — Removes leading and trailing whitespace from the string.
 *
 * In COBOL, fields are fixed-width so trailing spaces are normal.
 * This utility trims both leading and trailing spaces, which is useful
 * when interfacing with non-COBOL systems.
 *
 * @param value - The alphanumeric string to trim.
 * @param mode - Trim mode: "BOTH" (default), "LEADING", or "TRAILING".
 * @returns The trimmed string.
 * @throws {Error} If the input is not a string or mode is invalid.
 *
 * @example
 * STRING_TRIM("  HELLO  ")        // => "HELLO"
 * STRING_TRIM("  HELLO  ", "LEADING")  // => "HELLO  "
 * STRING_TRIM("  HELLO  ", "TRAILING") // => "  HELLO"
 */
export function STRING_TRIM(value: string, mode: "BOTH" | "LEADING" | "TRAILING" = "BOTH"): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-TRIM: expected PIC X, received ${typeof value}`);
  }
  const validModes = ["BOTH", "LEADING", "TRAILING"];
  if (!validModes.includes(mode)) {
    throw new Error(`STRING-TRIM: invalid mode '${mode}', expected one of ${validModes.join(", ")}`);
  }
  switch (mode) {
    case "LEADING":
      return value.replace(/^\s+/, "");
    case "TRAILING":
      return value.replace(/\s+$/, "");
    case "BOTH":
    default:
      return value.trim();
  }
}

/**
 * STRING-SPLIT — Splits a string into an array of substrings using a delimiter.
 *
 * COBOL equivalent: UNSTRING ... DELIMITED BY ...
 *
 * @param value - The alphanumeric string to split.
 * @param delimiter - The delimiter character or string.
 * @returns An array of substrings.
 * @throws {Error} If the input is not a string or delimiter is not a string.
 *
 * @example
 * STRING_SPLIT("A,B,C", ",")  // => ["A", "B", "C"]
 * STRING_SPLIT("KEY=VALUE", "=")  // => ["KEY", "VALUE"]
 */
export function STRING_SPLIT(value: string, delimiter: string): string[] {
  if (typeof value !== "string") {
    throw new Error(`STRING-SPLIT: expected PIC X for value, received ${typeof value}`);
  }
  if (typeof delimiter !== "string") {
    throw new Error(`STRING-SPLIT: expected PIC X for delimiter, received ${typeof delimiter}`);
  }
  if (delimiter === "") {
    throw new Error("STRING-SPLIT: delimiter must not be empty");
  }
  return value.split(delimiter);
}

/**
 * STRING-JOIN — Joins an array of strings into a single string using a separator.
 *
 * COBOL equivalent: STRING ... DELIMITED BY ... INTO ...
 *
 * @param items - Array of strings to join.
 * @param separator - The separator string to insert between items.
 * @returns The joined string.
 * @throws {Error} If items is not an array or contains non-string elements.
 *
 * @example
 * STRING_JOIN(["A", "B", "C"], ", ")  // => "A, B, C"
 * STRING_JOIN(["LINE1", "LINE2"], "\n")  // => "LINE1\nLINE2"
 */
export function STRING_JOIN(items: string[], separator: string): string {
  if (!Array.isArray(items)) {
    throw new Error(`STRING-JOIN: expected array of PIC X, received ${typeof items}`);
  }
  if (typeof separator !== "string") {
    throw new Error(`STRING-JOIN: expected PIC X for separator, received ${typeof separator}`);
  }
  for (let i = 0; i < items.length; i++) {
    if (typeof items[i] !== "string") {
      throw new Error(
        `STRING-JOIN: element at index ${i} is not PIC X (received ${typeof items[i]})`
      );
    }
  }
  return items.join(separator);
}

/**
 * STRING-REPLACE — Replaces all occurrences of a search string within the target.
 *
 * COBOL equivalent: INSPECT ... REPLACING ALL ...
 *
 * @param value - The original string.
 * @param search - The substring to search for.
 * @param replacement - The replacement string.
 * @returns The string with all occurrences replaced.
 * @throws {Error} If any argument is not a string, or if search is empty.
 *
 * @example
 * STRING_REPLACE("Hello World", "World", "COBOL-X")  // => "Hello COBOL-X"
 * STRING_REPLACE("aaa", "a", "bb")  // => "bbbbbb"
 */
export function STRING_REPLACE(value: string, search: string, replacement: string): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-REPLACE: expected PIC X for value, received ${typeof value}`);
  }
  if (typeof search !== "string") {
    throw new Error(`STRING-REPLACE: expected PIC X for search, received ${typeof search}`);
  }
  if (typeof replacement !== "string") {
    throw new Error(`STRING-REPLACE: expected PIC X for replacement, received ${typeof replacement}`);
  }
  if (search === "") {
    throw new Error("STRING-REPLACE: search string must not be empty");
  }
  return value.split(search).join(replacement);
}

/**
 * STRING-CONTAINS — Checks whether the target string contains the specified substring.
 *
 * COBOL equivalent: INSPECT ... TALLYING ... FOR LEADING/ALL ...
 *
 * @param value - The string to search within.
 * @param search - The substring to look for.
 * @returns 1 (true) if found, 0 (false) otherwise. Returns COBOL-style boolean.
 * @throws {Error} If any argument is not a string.
 *
 * @example
 * STRING_CONTAINS("Hello World", "World")  // => 1
 * STRING_CONTAINS("Hello World", "xyz")    // => 0
 */
export function STRING_CONTAINS(value: string, search: string): 0 | 1 {
  if (typeof value !== "string") {
    throw new Error(`STRING-CONTAINS: expected PIC X for value, received ${typeof value}`);
  }
  if (typeof search !== "string") {
    throw new Error(`STRING-CONTAINS: expected PIC X for search, received ${typeof search}`);
  }
  return value.includes(search) ? 1 : 0;
}

/**
 * STRING-LENGTH — Returns the length of the given string.
 *
 * COBOL equivalent: FUNCTION LENGTH.
 *
 * @param value - The string whose length is to be determined.
 * @returns The number of characters in the string.
 * @throws {Error} If the input is not a string.
 *
 * @example
 * STRING_LENGTH("HELLO")  // => 5
 * STRING_LENGTH("")       // => 0
 */
export function STRING_LENGTH(value: string): number {
  if (typeof value !== "string") {
    throw new Error(`STRING-LENGTH: expected PIC X, received ${typeof value}`);
  }
  return value.length;
}

/**
 * STRING-SUBSTRING — Extracts a portion of the string.
 *
 * COBOL equivalent: reference-modification (e.g., STRING(1:5)).
 *
 * @param value - The source string.
 * @param start - The 1-based starting position.
 * @param length - The number of characters to extract.
 * @returns The extracted substring.
 * @throws {Error} If arguments are invalid or out of range.
 *
 * @example
 * STRING_SUBSTRING("HELLO WORLD", 1, 5)   // => "HELLO"
 * STRING_SUBSTRING("HELLO WORLD", 7, 5)   // => "WORLD"
 */
export function STRING_SUBSTRING(value: string, start: number, length: number): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-SUBSTRING: expected PIC X, received ${typeof value}`);
  }
  if (!Number.isInteger(start) || start < 1) {
    throw new Error(`STRING-SUBSTRING: start position must be a positive integer, received ${start}`);
  }
  if (!Number.isInteger(length) || length < 0) {
    throw new Error(`STRING-SUBSTRING: length must be a non-negative integer, received ${length}`);
  }
  if (start - 1 >= value.length) {
    throw new Error(
      `STRING-SUBSTRING: start position ${start} exceeds string length ${value.length}`
    );
  }
  return value.substring(start - 1, start - 1 + length);
}

/**
 * STRING-PAD — Pads a string to a target length.
 *
 * COBOL equivalent: MOVE SPACES TO or manual padding with STRING.
 *
 * @param value - The source string.
 * @param targetLength - The desired total length.
 * @param padChar - The character to pad with (default: space).
 * @param mode - "RIGHT" (default) or "LEFT".
 * @returns The padded string.
 * @throws {Error} If arguments are invalid.
 *
 * @example
 * STRING_PAD("ABC", 10)            // => "ABC       "
 * STRING_PAD("123", 8, "0", "LEFT") // => "00000123"
 */
export function STRING_PAD(
  value: string,
  targetLength: number,
  padChar: string = " ",
  mode: "RIGHT" | "LEFT" = "RIGHT"
): string {
  if (typeof value !== "string") {
    throw new Error(`STRING-PAD: expected PIC X for value, received ${typeof value}`);
  }
  if (typeof padChar !== "string" || padChar.length !== 1) {
    throw new Error(`STRING-PAD: padChar must be a single character, received '${padChar}'`);
  }
  if (!Number.isInteger(targetLength) || targetLength < 0) {
    throw new Error(`STRING-PAD: targetLength must be a non-negative integer, received ${targetLength}`);
  }
  if (value.length >= targetLength) {
    return value.substring(0, targetLength);
  }
  const padding = padChar.repeat(targetLength - value.length);
  return mode === "LEFT" ? padding + value : value + padding;
}