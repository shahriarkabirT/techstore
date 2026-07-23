import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` milliseconds have elapsed since the last change.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 400);
 * // Use debouncedSearch in API queries — it will only fire after typing stops.
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
