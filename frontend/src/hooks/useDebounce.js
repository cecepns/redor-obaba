import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value (e.g. search query)
 * Minimum 300ms debounce according to AGENTS.md rules
 */
export const useDebounce = (value, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
