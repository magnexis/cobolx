/**
 * COBOL-X Standard Library — Math Built-in Functions
 *
 * Provides COBOL-style mathematical operations that extend the standard
 * COMPUTE verb with advanced numerical functions. All functions operate
 * on numeric (PIC 9 / PIC S9V9) values and return numbers.
 *
 * COBOL traditionally provides FUNCTION SQRT, FUNCTION ABS, etc.
 * This module provides a comprehensive set with consistent error handling.
 *
 * @module math_utils
 */

/**
 * COMPUTE-POWER — Raises a base number to a specified exponent.
 *
 * COBOL equivalent: base ** exponent (COBOL 2002+), or manual multiplication.
 *
 * @param base - The base number.
 * @param exponent - The exponent (must be non-negative for integer bases).
 * @returns The result of base raised to the power of exponent.
 * @throws {Error} If base is negative and exponent is not an integer.
 *
 * @example
 * COMPUTE_POWER(2, 10)   // => 1024
 * COMPUTE_POWER(3, 3)    // => 27
 * COMPUTE_POWER(9, 0.5)  // => 3
 */
export function COMPUTE_POWER(base: number, exponent: number): number {
  if (typeof base !== "number" || typeof exponent !== "number") {
    throw new Error(
      `COMPUTE-POWER: expected PIC 9 for both arguments, received ${typeof base} and ${typeof exponent}`
    );
  }
  if (base < 0 && !Number.isInteger(exponent)) {
    throw new Error(
      `COMPUTE-POWER: negative base ${base} with non-integer exponent ${exponent} produces NaN`
    );
  }
  return Math.pow(base, exponent);
}

/**
 * COMPUTE-SQRT — Computes the square root of a number.
 *
 * COBOL equivalent: FUNCTION SQRT.
 *
 * @param value - The numeric value (must be non-negative).
 * @returns The square root of the value.
 * @throws {Error} If the value is negative or not a number.
 *
 * @example
 * COMPUTE_SQRT(144)  // => 12
 * COMPUTE_SQRT(2)    // => 1.4142135623730951
 */
export function COMPUTE_SQRT(value: number): number {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-SQRT: expected PIC 9, received ${typeof value}`);
  }
  if (value < 0) {
    throw new Error(`COMPUTE-SQRT: argument must be non-negative, received ${value}`);
  }
  return Math.sqrt(value);
}

/**
 * COMPUTE-ABS — Returns the absolute value of a number.
 *
 * COBOL equivalent: FUNCTION ABS.
 *
 * @param value - The numeric value.
 * @returns The absolute (non-negative) value.
 * @throws {Error} If the value is not a number.
 *
 * @example
 * COMPUTE_ABS(-42)   // => 42
 * COMPUTE_ABS(42)    // => 42
 * COMPUTE_ABS(0)     // => 0
 */
export function COMPUTE_ABS(value: number): number {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-ABS: expected PIC 9, received ${typeof value}`);
  }
  return Math.abs(value);
}

/**
 * COMPUTE-MOD — Computes the remainder of division (modulo operation).
 *
 * COBOL equivalent: result = dividend / divisor with REMAINDER.
 * Unlike JavaScript's % operator, this always returns a non-negative
 * result when the divisor is positive, matching COBOL's REM behavior.
 *
 * @param dividend - The number to be divided.
 * @param divisor - The number to divide by (must not be zero).
 * @returns The remainder of the division.
 * @throws {Error} If either argument is not a number, or divisor is zero.
 *
 * @example
 * COMPUTE_MOD(17, 5)   // => 2
 * COMPUTE_MOD(20, 4)   // => 0
 * COMPUTE_MOD(-7, 3)   // => 2 (COBOL-style, always non-negative)
 */
export function COMPUTE_MOD(dividend: number, divisor: number): number {
  if (typeof dividend !== "number" || typeof divisor !== "number") {
    throw new Error(
      `COMPUTE-MOD: expected PIC 9 for both arguments, received ${typeof dividend} and ${typeof divisor}`
    );
  }
  if (divisor === 0) {
    throw new Error("COMPUTE-MOD: division by zero — divisor must not be zero");
  }
  // COBOL-style: remainder is always non-negative when divisor is positive
  const remainder = dividend % divisor;
  return remainder < 0 ? remainder + Math.abs(divisor) : remainder;
}

/**
 * COMPUTE-MIN — Returns the smallest of the given numeric values.
 *
 * COBOL equivalent: FUNCTION MIN.
 *
 * @param values - Array of numeric values to compare.
 * @returns The smallest value.
 * @throws {Error} If values array is empty or contains non-numeric elements.
 *
 * @example
 * COMPUTE_MIN([3, 1, 4, 1, 5])  // => 1
 * COMPUTE_MIN([-10, 0, 10])     // => -10
 */
export function COMPUTE_MIN(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("COMPUTE-MIN: values array must not be empty");
  }
  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] !== "number" || Number.isNaN(values[i])) {
      throw new Error(
        `COMPUTE-MIN: element at index ${i} is not a valid PIC 9 (received ${values[i]})`
      );
    }
  }
  return Math.min(...values);
}

/**
 * COMPUTE-MAX — Returns the largest of the given numeric values.
 *
 * COBOL equivalent: FUNCTION MAX.
 *
 * @param values - Array of numeric values to compare.
 * @returns The largest value.
 * @throws {Error} If values array is empty or contains non-numeric elements.
 *
 * @example
 * COMPUTE_MAX([3, 1, 4, 1, 5])  // => 5
 * COMPUTE_MAX([-10, 0, 10])     // => 10
 */
export function COMPUTE_MAX(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("COMPUTE-MAX: values array must not be empty");
  }
  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] !== "number" || Number.isNaN(values[i])) {
      throw new Error(
        `COMPUTE-MAX: element at index ${i} is not a valid PIC 9 (received ${values[i]})`
      );
    }
  }
  return Math.max(...values);
}

/**
 * COMPUTE-ROUND — Rounds a number to a specified number of decimal places.
 *
 * COBOL equivalent: ROUNDED MODE IS NEAREST-AWAY-FROM-ZERO on COMPUTE.
 * Uses "round half away from zero" (banker's rounding), which is the
 * standard COBOL ROUNDED behavior.
 *
 * @param value - The numeric value to round.
 * @param decimalPlaces - The number of decimal places (default: 0).
 * @returns The rounded number.
 * @throws {Error} If arguments are invalid.
 *
 * @example
 * COMPUTE_ROUND(3.456, 2)  // => 3.46
 * COMPUTE_ROUND(3.454, 2)  // => 3.45
 * COMPUTE_ROUND(2.5, 0)    // => 3
 * COMPUTE_ROUND(-2.5, 0)   // => -3
 */
export function COMPUTE_ROUND(value: number, decimalPlaces: number = 0): number {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-ROUND: expected PIC 9 for value, received ${typeof value}`);
  }
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error(
      `COMPUTE-ROUND: decimalPlaces must be a non-negative integer, received ${decimalPlaces}`
    );
  }
  // COBOL "round half away from zero" behavior
  const factor = Math.pow(10, decimalPlaces);
  const shifted = value * factor;
  // Use Math.sign to handle negative numbers correctly (away from zero)
  return (Math.sign(shifted) * Math.round(Math.abs(shifted))) / factor;
}

/**
 * COMPUTE-FLOOR — Returns the largest integer less than or equal to a number.
 *
 * COBOL equivalent: FUNCTION INTEGER when value is positive.
 *
 * @param value - The numeric value.
 * @returns The floor of the value.
 * @throws {Error} If the value is not a number.
 *
 * @example
 * COMPUTE_FLOOR(3.7)   // => 3
 * COMPUTE_FLOOR(-3.2)  // => -4
 * COMPUTE_FLOOR(5)     // => 5
 */
export function COMPUTE_FLOOR(value: number): number {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-FLOOR: expected PIC 9, received ${typeof value}`);
  }
  return Math.floor(value);
}

/**
 * COMPUTE-CEIL — Returns the smallest integer greater than or equal to a number.
 *
 * COBOL equivalent: FUNCTION INTEGER-PART + 1 when value has a fraction.
 *
 * @param value - The numeric value.
 * @returns The ceiling of the value.
 * @throws {Error} If the value is not a number.
 *
 * @example
 * COMPUTE_CEIL(3.2)   // => 4
 * COMPUTE_CEIL(-3.7)  // => -3
 * COMPUTE_CEIL(5)     // => 5
 */
export function COMPUTE_CEIL(value: number): number {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-CEIL: expected PIC 9, received ${typeof value}`);
  }
  return Math.ceil(value);
}

/**
 * COMPUTE-SIGN — Determines the sign of a number.
 *
 * Returns -1, 0, or 1 depending on whether the value is negative, zero, or positive.
 *
 * @param value - The numeric value to test.
 * @returns -1 if negative, 0 if zero, 1 if positive.
 * @throws {Error} If the value is not a number.
 *
 * @example
 * COMPUTE_SIGN(-42)  // => -1
 * COMPUTE_SIGN(0)    // => 0
 * COMPUTE_SIGN(42)   // => 1
 */
export function COMPUTE_SIGN(value: number): -1 | 0 | 1 {
  if (typeof value !== "number") {
    throw new Error(`COMPUTE-SIGN: expected PIC 9, received ${typeof value}`);
  }
  if (value < 0) return -1;
  if (value > 0) return 1;
  return 0;
}

/**
 * COMPUTE-CLAMP — Restricts a value to be within a specified range.
 *
 * Useful for ensuring values stay within COBOL PIC bounds.
 *
 * @param value - The numeric value to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns The value clamped to [min, max].
 * @throws {Error} If arguments are invalid or min > max.
 *
 * @example
 * COMPUTE_CLAMP(15, 0, 10)   // => 10
 * COMPUTE_CLAMP(-5, 0, 10)   // => 0
 * COMPUTE_CLAMP(5, 0, 10)    // => 5
 */
export function COMPUTE_CLAMP(value: number, min: number, max: number): number {
  if (typeof value !== "number" || typeof min !== "number" || typeof max !== "number") {
    throw new Error("COMPUTE-CLAMP: all arguments must be PIC 9");
  }
  if (min > max) {
    throw new Error(`COMPUTE-CLAMP: min (${min}) must not exceed max (${max})`);
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * COMPUTE-PERCENTAGE — Calculates a percentage of a value.
 *
 * Common business computation in COBOL programs.
 *
 * @param value - The base value.
 * @param percentage - The percentage (e.g., 25 for 25%).
 * @returns The calculated percentage of the value.
 * @throws {Error} If arguments are not numbers.
 *
 * @example
 * COMPUTE_PERCENTAGE(200, 15)  // => 30
 * COMPUTE_PERCENTAGE(100, 0.5) // => 0.5
 */
export function COMPUTE_PERCENTAGE(value: number, percentage: number): number {
  if (typeof value !== "number" || typeof percentage !== "number") {
    throw new Error("COMPUTE-PERCENTAGE: all arguments must be PIC 9");
  }
  return (value * percentage) / 100;
}