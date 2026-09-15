import { isBoundaryGeometry, isStreetGeometry } from './featureTypeCheck';
import type { MaptilerFeature } from '../../types';

type FeatureCallbacks = {
    onBoundaryType: (feature: MaptilerFeature, label: string) => void;
    onStreetType: (feature: MaptilerFeature, label: string) => void;
    onOtherType: (center: [number, number] | null | undefined) => void;
};

const updateFeatureState = (
    feature: MaptilerFeature | null,
    label: string,
    fallbackPoint: [number, number] | null | undefined,
    { onBoundaryType, onStreetType, onOtherType }: FeatureCallbacks,
) => {
    if (feature && isBoundaryGeometry(feature)) {
        onBoundaryType(feature, label);
    } else if (feature && isStreetGeometry(feature)) {
        onStreetType(feature, label);
    } else {
        onOtherType(feature?.center ?? fallbackPoint);
    }
};

export default updateFeatureState;