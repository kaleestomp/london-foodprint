import type * as maplibregl from 'maplibre-gl';
import buildCircleHole from '../polygonMask/buildCircleHole';
import { type LatLngTuple, WORLD_RING } from '../polygonMask/geometry';

type LngLatTuple = [number, number];
const BUILDING_LAYER_ID = '3d-buildings';

const closeRing = (ring: LatLngTuple[]): LatLngTuple[] => {
	if (ring.length === 0) return ring;
	const firstPoint = ring[0];
	const lastPoint = ring[ring.length - 1];
	const alreadyClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
	return alreadyClosed ? ring : [...ring, firstPoint];
};

const toGeoJsonRing = (ring: LatLngTuple[]): LngLatTuple[] => (
	closeRing(ring).map(([lat, lng]) => [lng, lat])
);

const signedArea = (ring: LngLatTuple[]): number => {
	if (ring.length < 3) return 0;
	let area = 0;
	for (let i = 0; i < ring.length - 1; i += 1) {
		const [x1, y1] = ring[i];
		const [x2, y2] = ring[i + 1];
		area += (x1 * y2) - (x2 * y1);
	}
	return area / 2;
};

const closeLngLatRing = (ring: LngLatTuple[]): LngLatTuple[] => {
	if (ring.length === 0) return ring;
	const [firstLng, firstLat] = ring[0];
	const [lastLng, lastLat] = ring[ring.length - 1];
	const alreadyClosed = firstLng === lastLng && firstLat === lastLat;
	return alreadyClosed ? ring : [...ring, [firstLng, firstLat]];
};

const orientRing = (ring: LngLatTuple[], clockwise: boolean): LngLatTuple[] => {
	const closed = closeLngLatRing(ring);
	const isClockwise = signedArea(closed) < 0;
	return isClockwise === clockwise ? closed : [...closed].reverse();
};

const buildPolygonFeature = (rings: LatLngTuple[][]) => ({
	type: 'Feature' as const,
	properties: {},
	geometry: {
		type: 'Polygon' as const,
		coordinates: rings.map((ring, index) => orientRing(toGeoJsonRing(ring), index > 0)),
	},
});

const PolygonMask = (
	map: maplibregl.Map,
	lat: number,
	lng: number,
	initialRings: LatLngTuple[][] = [WORLD_RING, buildCircleHole(lat, lng, 1)],
): {
	setLatLngs: (rings: LatLngTuple[][]) => void;
	setStyle: (style: { fillOpacity?: number }) => void;
	remove: () => void;
} => {
	const idSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
	const sourceId = `bubble-avatar-mask-source-${idSuffix}`;
	const layerId = `bubble-avatar-mask-layer-${idSuffix}`;
	let removed = false;
	let currentOpacity = 0;
	let currentRings = initialRings;

	const applyData = () => {
		const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
		if (source) source.setData(buildPolygonFeature(currentRings));
	};

	const moveMaskAboveBuildings = () => {
		if (!map.getLayer(layerId)) return;
		const layers = map.getStyle().layers ?? [];
		const buildingIndex = layers.findIndex((layer) => layer.id === BUILDING_LAYER_ID);
		const beforeId = buildingIndex < 0 ? undefined : layers[buildingIndex + 1]?.id;
		map.moveLayer(layerId, beforeId);
	};

	const ensureLayer = () => {
		if (removed || !map.isStyleLoaded()) return;
		if (!map.getSource(sourceId)) {
			map.addSource(sourceId, { type: 'geojson', data: buildPolygonFeature(currentRings) });
		}
		if (!map.getLayer(layerId)) {
			map.addLayer({
				id: layerId,
				type: 'fill',
				source: sourceId,
				paint: { 'fill-color': '#000000', 'fill-opacity': currentOpacity },
			});
		}
		moveMaskAboveBuildings();
	};

	map.on('styledata', ensureLayer);
	map.on('pitch', moveMaskAboveBuildings);
	ensureLayer();

	return {
		setLatLngs: (rings) => {
			currentRings = rings;
			if (!map.getSource(sourceId) || !map.getLayer(layerId)) ensureLayer();
			applyData();
		},
		setStyle: ({ fillOpacity }) => {
			if (typeof fillOpacity !== 'number' || !Number.isFinite(fillOpacity)) return;
			currentOpacity = Math.max(0, Math.min(1, fillOpacity));
			if (!map.getSource(sourceId) || !map.getLayer(layerId)) ensureLayer();
			if (map.getLayer(layerId)) map.setPaintProperty(layerId, 'fill-opacity', currentOpacity);
		},
		remove: () => {
			removed = true;
			map.off('styledata', ensureLayer);
			map.off('pitch', moveMaskAboveBuildings);
			if (map.getLayer(layerId)) map.removeLayer(layerId);
			if (map.getSource(sourceId)) map.removeSource(sourceId);
		},
	};
};

export default PolygonMask;