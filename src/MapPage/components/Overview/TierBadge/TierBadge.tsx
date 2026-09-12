import type { FC } from 'react';

import SimplePie from './SimplePie/SimplePie';
import SimplePieSkeleton from './SimplePie/SimplePieSkeleton';
import formatTierTag from './formatTierTag';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { useCityContext } from '../../../../context/CityContext';

const TierBadge: FC<{
    value?: number;
    isFirstLoading?: boolean;
}> = ({ value, isFirstLoading }) => {
    const { scoreTier } = useSearchFilters();
    const tierTag = formatTierTag(scoreTier ?? 0);
    const { cityParams } = useCityContext();
    const { display_name: city } = cityParams;
    
    return (
        <>
            {!isFirstLoading
                ? <SimplePie percentValue={value ?? 0} labelValue={tierTag} city={city} />
                : <SimplePieSkeleton />}
        </>
    );
};

export default TierBadge;
