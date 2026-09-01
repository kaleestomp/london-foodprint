import { useEffect, useState } from 'react';
import { useSearchFilters } from '../../../context/SearchFiltersContext';
import useRestaurantCount from './useRestaurantCount';

const TIMEOUT_MS = 1000;

const useResultSummary = (): { headline: string; subline: string } => {
  const { searchMask } = useSearchFilters();
  const { count, isFetching } = useRestaurantCount();

  const [displayCount, setDisplayCount] = useState<number | null>(count);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (count !== displayCount) {
      setDisplayCount(count);
    }
  }, [count, displayCount]);

  useEffect(() => {
    if (!isFetching) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isFetching]);

  // On initialize Load (count === null), or when loading, 
  // show "Searching..." message. Otherwise
  if (showLoading || displayCount === null) {
    return { headline: 'Searching...', subline: 'for hidden gems in the area' };
  } 

  const unit = displayCount === 1 ? 'Hidden Gem' : 'Hidden Gems';
  const headline = searchMask ? `${displayCount} ${unit}` //within 10 minutes walk
    : `${displayCount} ${unit}`; //in this area
  const subline = searchMask ? 'within 10 minutes walk' : 'in this area';

  return { headline, subline };

};
export default useResultSummary;
