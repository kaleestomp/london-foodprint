import { useEffect, useState } from 'react';

// SUGGESTED SEARCH ONLY FIRES 
// ONCE MORE THAN 4 CHARACTERS ARE ENTERED.
export const MIN_QUERY_LENGTH = 4;
const DEBOUNCE_MS = 400;

const useDebounceQuery = (query: string) => {

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const nextQuery = query.trim();
    if (nextQuery.length < MIN_QUERY_LENGTH) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(nextQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return debouncedQuery;
};

export default useDebounceQuery;
