import { PRICE_RANGE_FILTER_OPTIONS } from '../../../../../context/SearchFiltersContext';
import { type NearbyResponse } from '../../../../request/useRequestNearby/request';
import { type CostHistogramEntry } from '../../../../request/useRequestPriceHistogram/request';

const UNSPECIFIED_LABEL = 'Unspecified';
const aggregatePrice = (
    nearbyRes: NearbyResponse | null,
): CostHistogramEntry[] => {

    const priceCounts = new Map<string, number>();

    for (const place of nearbyRes?.data ?? []) {
        const cost = place.cost ?? UNSPECIFIED_LABEL;
        priceCounts.set(cost, (priceCounts.get(cost) ?? 0) + 1);
    }
    const priceHistogram = [
        ...PRICE_RANGE_FILTER_OPTIONS.map((cost) => ({
            cost,
            count: priceCounts.get(cost) ?? 0,
        })),
        ...(priceCounts.has(UNSPECIFIED_LABEL)
            ? [{ cost: UNSPECIFIED_LABEL, count: priceCounts.get(UNSPECIFIED_LABEL) ?? 0 }]
            : []),
    ];

    return priceHistogram;
};

export default aggregatePrice;