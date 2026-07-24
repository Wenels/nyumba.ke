import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delay` milliseconds of inactivity.
 *
 * Use this to delay expensive side-effects (API calls, filters)
 * triggered by fast user input like typing in a search box.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
