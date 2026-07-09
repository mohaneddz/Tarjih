/**
 * Helper to conditionally combine CSS class names.
 * Accepts strings, booleans, objects, arrays, etc., and merges them into a clean string.
 *
 * @param inputs - List of class values or conditional objects
 * @returns A space-separated string of active class names
 */
export function cn(...inputs: unknown[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const resolved = cn(...input);
      if (resolved) classes.push(resolved);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.filter(Boolean).join(" ");
}
