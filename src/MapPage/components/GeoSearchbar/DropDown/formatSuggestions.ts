import { useMemo } from 'react';
import { type LocationResult } from '../fetchHooks/useGeoSearch';
import { type DropdownItem } from './GeoSearchbarDropdown';

const splitDisplayName = (displayName: string): Pick<DropdownItem, 'primary' | 'secondary'> => {
    const comma = displayName.indexOf(',');
    return {
        primary: comma > -1 ? displayName.slice(0, comma) : displayName,
        secondary: comma > -1 ? displayName.slice(comma + 2) : '',
    };
};

type Props = { suggestions: LocationResult[] };
const formatSuggestions = ({ suggestions }: Props): DropdownItem[] => {

    const items: DropdownItem[] = useMemo(() => {
        return suggestions.map((s) => ({ ...s, ...splitDisplayName(s.display_name) }));
    }, [suggestions]);

    return items;
};

export default formatSuggestions;
