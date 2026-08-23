import { useCallback, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../../context/AppUIContext';
import { type SearchMask } from '../../LayerStates/maskResults';
import { type PersistentLayer } from '../../LayerStates/createPersistentLayer';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import { cancelLayerRemoval, scheduleLayerRemoval } from '../lifecycle/lifecycle';
import addMarkers from './densityMarkers/addMarkers';
import getExplodeFlyInOffset from './markerTransitions/getExplodeFlyInOffset';
import animateLayerClear from './animateLayerClear';
import sortMarkerRegistry from './sortMarkerRegistry';
import getIncomingMarkers from './getIncomingMarkers';

export type TileMarkerRegistry = Map<string, { Marker: maplibregl.Marker; SingletonId: string | null }>;
export interface DensityLayer {
    markerRef: React.RefObject<TileMarkerRegistry>;
    currentResRef: React.RefObject<number | null>;
    refreshLayer: (res: number, tiles: TileDensity[]) => void;
    addMarkersToLayer: (res: number, tiles: TileDensity[]) => void;
    setMaskVisibility: (searchMask: SearchMask | null) => void;
    dedupSingletons: (placeIds: Set<string>) => void;
    cancelScheduledRemoval: () => void;
    resetLayerState: () => void;
}

const useDensityLayer = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    layerRef: React.RefObject<PersistentLayer | null>,
): DensityLayer => {
    const { mapMode } = useAppUI();
    const densityIconColor: [number, number, number] = mapMode === 'dark' ? [255, 255, 255] : [0, 0, 0];
    const markerRef = useRef<TileMarkerRegistry>(new Map());
    const currentResRef = useRef<number | null>(null);
    const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRemovalRef = useRef<maplibregl.Marker[]>([]);

    // ── Public API ─────────────────────────────────────────────────────────────
    // CANCEL PENDING REMOVAL (e.g. when switching to place markers)
    const cancelScheduledRemoval = useCallback(() => {
        cancelLayerRemoval(layerRef.current, cleanupTimerRef, pendingRemovalRef);
    }, [layerRef]);

    const scheduleRemoval = useCallback((markers: maplibregl.Marker[], delayMs: number) => {
        const layer = layerRef.current;
        if (layer) scheduleLayerRemoval(layer, markers, delayMs, cleanupTimerRef, pendingRemovalRef);
    }, [layerRef]);

    const resetLayerState = useCallback(() => {
        markerRef.current = new Map();
        currentResRef.current = null;
    }, []);

    // ADD MARKERS ON PAN / ZOOM
    const addMarkersToLayer = useCallback((resolution: number, tiles: TileDensity[], startOffsets?: Map<string, { dx: number; dy: number }>): void => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;

        const before = new Set(markerRef.current.values());
        addMarkers({ map, tiles, resolution, startOffsets, iconColor: densityIconColor, markerRegistry: markerRef.current });
        markerRef.current.forEach((entry) => {
            if (!before.has(entry)) layer.markers.add(entry.Marker);
        });
        currentResRef.current = resolution;
    }, [densityIconColor, layerRef, mapRef]);

    // REFERSH LAYER ON ZOOM / SPECIFIED CALL
    // ZOOM-IN: Old pins burst  outward,  new child pins fly in from parent positions.
    // ZOOM-OUT: Old pins merge toward parent centroid, new parent pins pop in.
    const refreshLayer = useCallback((resolution: number, tiles: TileDensity[]): void => {
        const map = mapRef.current;
        if (!map) return;

        cancelScheduledRemoval();
        const previousResolution = currentResRef.current;
        const zoomingIn = previousResolution !== null && resolution > previousResolution;

        // FOR SINGLETONS ONLY:
        // If an old marker sees identical new marker coming in, old marker stays.
        // If a new marker see identicak older marker already exist, new marker is ignored.
        const { outgoings, retained } = sortMarkerRegistry(tiles, markerRef.current);
        const incomingTiles = getIncomingMarkers(tiles, markerRef.current);

        // RESET LAYER + HANDOFF RETAINED MARKERS TO NEW LAYER
        resetLayerState();
        markerRef.current = retained;
        currentResRef.current = resolution;

        // ANIMATE MARKER EXIT: Burst / Merge / Fade Out CSS Class
        animateLayerClear(map, resolution, previousResolution, outgoings);
        // ADD NEW MARKERS + Fly-in Entry
        const startOffsets = zoomingIn
            ? getExplodeFlyInOffset(map, outgoings, previousResolution!, incomingTiles)
            : undefined;
        addMarkersToLayer(resolution, incomingTiles, startOffsets);
        // SCHEDULE REMOVAL of outgoing markers after animation delay
        const outgoingMarkers = Array.from(outgoings.values()).map((entry) => entry.Marker)
        scheduleRemoval(outgoingMarkers, zoomingIn ? 0 : 280);
    }, [addMarkersToLayer, cancelScheduledRemoval, mapRef, resetLayerState, scheduleRemoval]);

    // DEDUP MARKERS
    // eg.singletons against top places id
    const dedupSingletons = useCallback((placeIds: Set<string>): void => {
        const layer = layerRef.current;
        markerRef.current.forEach(({ Marker, SingletonId }, tileId) => {
            if (!(SingletonId && placeIds.has(SingletonId))) return;
            Marker.remove();
            layer?.markers.delete(Marker);
            markerRef.current.delete(tileId);
        });
    }, [layerRef]);

    // MASK MARKERS
    // When nearby search is active, density markers are hidden
    const setMaskVisibility = useCallback((searchMask: SearchMask | null): void => {
        markerRef.current.forEach(({ Marker }) => {
            const element = Marker.getElement();
            if (!searchMask) {
                element.style.opacity = '1';
                return;
            }
            const point = Marker.getLngLat();
            const distance = point.distanceTo(new maplibregl.LngLat(searchMask.center.lng, searchMask.center.lat));
            element.style.opacity = distance <= searchMask.radiusM ? '0' : '1';
        });
    }, []);

    return useMemo(() => ({
        markerRef,
        currentResRef,
        refreshLayer,
        addMarkersToLayer,
        setMaskVisibility,
        dedupSingletons,
        cancelScheduledRemoval,
        resetLayerState,
    }), [
        refreshLayer, addMarkersToLayer, 
        setMaskVisibility, dedupSingletons, 
        cancelScheduledRemoval, resetLayerState
    ]);
};

export default useDensityLayer;
