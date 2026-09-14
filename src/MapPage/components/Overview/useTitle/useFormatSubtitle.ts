import { useSearchFilters } from '../../../../context/SearchFiltersContext';

const useFormatSubtitle = (
): string => {

  const { searchMask } = useSearchFilters();
  const subtitle = searchMask ? 'within 10 minutes walk' 
    : `within view`;

  return subtitle;

};
export default useFormatSubtitle;
