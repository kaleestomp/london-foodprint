import { useCallback, useId, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../context/AppUIContext';
import useGeoSearch, { type LocationResult } from './fetchHooks/useGeoSearch';
import useReverseGeocode from './fetchHooks/useReverseGeocode';
import GeoSearchbarInput from './InputBox/GeoSearchbarInput';
import GeoSearchbarDropdown from './DropDown/GeoSearchbarDropdown';
import GeoSearchbarMyLocationButton from './MyLocation/GeoSearchbarMyLocationButton';
import GeoSearchbarClearButton from './ClearButton/GeoSearchbarClearButton';
import GeoSearchbarInitializeButton from './InitializeButton/GeoSearchbarInitializeButton';
import useGeoSearchbarAnimation from './animationHooks/useGeoSearchbarAnimation';
import toLatLng from './DropDown/toLatLng';

import './GeoSearchbar.css';

type Props = {
    mapRef: React.RefObject<maplibregl.Map | null>;
    onDropdownOpenChange?: (isOpen: boolean) => void;
};

const GeoSearchbar: React.FC<Props> = ({ mapRef, onDropdownOpenChange }) => {
    
    const [query, setQuery] = useState('');
    const { suggestions, isLoading, filteredOutAll } = useGeoSearch(query);
    const hasDropdownContent = isLoading || suggestions.length > 0 || filteredOutAll;
    const {
        rootRef,
        inputRef,
        expanded,
        isCollapsing,
        showExpandedLayout,
        showDropdown,
        reopenSearch,
        onExpand,
        onInputKeyDown,
        closeDropdown,
    } = useGeoSearchbarAnimation({
        query,
        hasDropdownContent,
        onDropdownOpenChange,
    });

    const { queueLiveLocationDrop } = useAppUI();
    const handleDropdownSelect = (result: LocationResult) => {
        setQuery(result.display_name);
        closeDropdown();
        const latLng = toLatLng(result);
        if (latLng) {
            queueLiveLocationDrop(latLng.lat, latLng.lng);
        }
    };

    const { lookup } = useReverseGeocode();
    const handleLiveLocationDrop = useCallback(async (lat: number, lng: number) => {
        queueLiveLocationDrop(lat, lng);
        const result = await lookup(lat, lng);
        setQuery(result.display_name);
        closeDropdown();
    }, [closeDropdown, lookup, queueLiveLocationDrop]);

    const dropdownId = useId();

    return (
        <div
            ref={rootRef}
            className={`geo-searchbar${expanded ? ' is-expanded' : ''}${isCollapsing ? ' is-collapsing' : ''}`}
        >
            {!showExpandedLayout ? (
                <GeoSearchbarInitializeButton
                    dropdownId={dropdownId}
                    showDropdown={showDropdown}
                    onExpand={onExpand}
                />
            ) : (
                <div className="geo-searchbar-panel">
                    <GeoSearchbarInput
                        inputRef={inputRef}
                        value={query}
                        onFocus={reopenSearch}
                        onKeyDown={onInputKeyDown}
                        onChange={(value) => {
                            reopenSearch();
                            setQuery(value);
                        }}
                        showSearch={showExpandedLayout}
                        leftAction={query && (
                            <GeoSearchbarClearButton
                                onClear={() => setQuery('')}
                            />
                        )}
                        rightAction={(
                            <GeoSearchbarMyLocationButton
                                mapRef={mapRef}
                                onLiveLocationDrop={handleLiveLocationDrop}
                            />
                        )}
                    />
                    <GeoSearchbarDropdown
                        dropdownId={dropdownId}
                        showDropdown={showDropdown}
                        isLoading={isLoading}
                        filteredOutAll={filteredOutAll}
                        suggestions={suggestions}
                        onSelect={handleDropdownSelect}
                    />
                </div>
            )}
        </div>
    );
};

export default GeoSearchbar;
