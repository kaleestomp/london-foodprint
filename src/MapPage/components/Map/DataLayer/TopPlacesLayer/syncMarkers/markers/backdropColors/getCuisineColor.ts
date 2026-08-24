import type { ExpressionSpecification } from 'maplibre-gl';
import { CUISINE_DISPLAY } from '../../../../../../../../utils/format/formatCuisines';
import preDerivedIconColors from './preDerivedIconColors';

const DEFAULT_CUISINE_DISPLAY = 'Bistro';
export const CUISINE_COLOR_FALLBACK = 'rgb(255, 255, 255)';

export const getCuisineColor = (cuisineType?: string | null): string => {
    const displayName = cuisineType ? (CUISINE_DISPLAY[cuisineType] ?? DEFAULT_CUISINE_DISPLAY) : DEFAULT_CUISINE_DISPLAY; 
    return preDerivedIconColors[displayName.toLowerCase()] ?? CUISINE_COLOR_FALLBACK;
};

export const getCuisineColorExpression = (
    cuisineTypeExpression: ExpressionSpecification,
): ExpressionSpecification => {
    const matchExpression: (string | ExpressionSpecification)[] = [
        'match',
        ['coalesce', cuisineTypeExpression, 'Unspecified'] as ExpressionSpecification,
    ];

    for (const cuisineType of Object.keys(CUISINE_DISPLAY)) {
        matchExpression.push(cuisineType, getCuisineColor(cuisineType));
    }

    matchExpression.push(CUISINE_COLOR_FALLBACK);
    return matchExpression as ExpressionSpecification;
};
