import requestFeatureGeometry from './requestFeatureGeometry';
import { isBoundaryGeometry, isStreetGeometry } from './featureTypeCheck';
import type { MaptilerFeature } from '../../types';

const fetchMaptilerFeatureAndSetStates = (
    featureId: string,
    featureLabel: string,
    fallbackCenter: [number, number] | null | undefined,
    onBoundaryType: (feature: MaptilerFeature, label: string) => void,
    onStreetType: (feature: MaptilerFeature, label: string) => void,
    onOtherType: (center: [number, number] | null | undefined) => void,
) => {

    // Resolve administrative and street candidates by feature id. This is
    // necessary because autocomplete returns a point centroid while the
    // feature endpoint returns the full Polygon or MultiLineString geometry.
    requestFeatureGeometry(featureId)
        .then((feature: MaptilerFeature | null) => {
            if (feature && isBoundaryGeometry(feature)) {
                onBoundaryType(feature, featureLabel);
            } else if (feature && isStreetGeometry(feature)) {
                onStreetType(feature, featureLabel);
            } else {
                onOtherType(feature?.center ?? fallbackCenter);
            }
        }).catch(() => {
            onOtherType(fallbackCenter);
        });
};

export default fetchMaptilerFeatureAndSetStates;