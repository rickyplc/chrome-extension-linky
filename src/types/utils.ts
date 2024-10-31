/**
 * Utility function to provide a default value if the given value is undefined.
 *
 * @param value - The value that might be undefined
 * @param defaultValue - The default value to use if `value` is undefined
 * @returns The original value if defined, otherwise the default value
 */
export const withDefault = <T>(value: T | undefined, defaultValue: T): T => {
  return value !== undefined ? value : defaultValue;
};
