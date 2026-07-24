import { useEffect, useState } from 'react';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRestaurantCount from './useRestaurantCount';

const TIMEOUT_MS = 1000;

const useResultSummary = (): string => {
  const { searchMask } = useSearchFilters();
  const { count, isLoading } = useRestaurantCount();

  const [displayCount, setDisplayCount] = useState<number | null>(count);
  // when count finish loading, 
  // update displayCount to the latest count value
  useEffect(() => {
    if (!isLoading  && count !== displayCount) {
      setDisplayCount(count);
    }
  }, [count, isLoading, displayCount]);

  // when count is loading and displayCount is not null,
  // set a timer to clear displayCount after 500ms
  useEffect(() => {
    if (isLoading && displayCount !== null) {
      const timer = setTimeout(() => {
        setDisplayCount(null);
      }, TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [isLoading, displayCount]);

  
  if (displayCount === null) {
    return 'Searching...';
  } 

  const unit = displayCount === 1 ? 'result' : 'results';
  return searchMask ? `${displayCount} ${unit} within 10 minutes walk` 
    : `${displayCount} ${unit} in this area`;

};
export default useResultSummary;
