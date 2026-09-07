import type { ExpressionSpecification } from 'maplibre-gl';

export const DEFAULT_GRADIENT: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(33, 102, 172, 0)',
    0.2, '#2c7bb6',
    0.4, '#abd9e9',
    0.6, '#ffffbf',
    0.8, '#fdae61',
    1, '#d7191c',
];

export const VIRIDIS: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(68, 1, 84, 0)',
    0.25, '#3b528b',
    0.5, '#21918c',
    0.75, '#5ec962',
    1, '#fde725',
];

export const VIRIDIS_BRIGHT: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(77, 236, 255, 0)',
    0.25, '#55e7ff',
    0.5, '#00d9ff',
    0.75, '#aaff52',
    1, '#fff36b',
];

export const MAGMA: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(59, 15, 112, 0)',
    0.25, '#3b0f70',
    0.5, '#8c2981',
    0.75, '#de4968',
    1, '#fe9f6d',
];

export const INFERNO: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0, 0, 0, 0)',
    0.25, '#420a68',
    0.5, '#932567',
    0.75, '#dd513a',
    1, '#fca50a',
];

export const YlOrBr: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(255, 255, 204, 0)',
    0.25, '#fff7bc',
    0.5, '#fec44f',
    0.75, '#ec7014',
    1, '#662506',
];

export const YlGnBu: ExpressionSpecification = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(255, 255, 217, 0)',
    0.25, '#c7e9b4',
    0.5, '#41b6c4',
    0.75, '#2c7fb8',
    1, '#253494',
];