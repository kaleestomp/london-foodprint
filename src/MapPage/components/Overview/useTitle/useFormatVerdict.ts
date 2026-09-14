import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import readTierPercentage from '../TierBadge/formatTierTag';

const useFormatVerdict = (
  tierRep: number
): string => {

  const { scoreTier } = useSearchFilters();
  const tierPercentage = readTierPercentage(scoreTier ?? 0);
  const verdict = 
    Math.abs(tierRep - tierPercentage) <= 2.5 ? 'about city average' 
    : tierRep - tierPercentage > 0 ? 'above city average' : 'below city average';

  return `*${verdict}`;

};
export default useFormatVerdict;
