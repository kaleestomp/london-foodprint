import { useEffect, useState } from 'react';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';

const TIMEOUT_MS = 1000;

const useFormatSubfix = (
  count: number | null
): string => {

  const { scoreTier } = useSearchFilters();
  const [displayCount, setDisplayCount] = useState<number | null>(count);
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    if (count !== displayCount) {
      setDisplayCount(count);
    }
  }, [count, displayCount]);

  useEffect(() => {
    if (count !== null) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [count]);

  // On initialize Load (count === null), or when loading, 
  // show "Searching..." message. Otherwise
  if (showLoading || displayCount === null) {
    return 'Searching...';
  } 

  const unit = scoreTier === 4 ? 'Absolute Gem' 
    : scoreTier === 3 ? 'Absolute Gem'
    : scoreTier === 2 ? 'Good Find'
    : scoreTier === 1 ? 'Decent Place'
    : 'Place';
  const subfix = displayCount === 1 ? unit : `${unit}s`;

  return subfix;

};
export default useFormatSubfix;
