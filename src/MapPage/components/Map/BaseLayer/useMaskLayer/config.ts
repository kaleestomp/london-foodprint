export const MASK_LAYER_IDS = {
  sourceId: 'inverted-mask-source',
  fillLayerId: 'inverted-mask-fill',
  outlineLayerId: 'inverted-mask-outline',
};
export const OPTIONS: {
    fillColor: string;
    fillOpacity: number;
    showOutline: boolean;
    lineColor: string;
    lineWidth: number;
    lineOpacity: number;
    beforeId: string | undefined;
} = {
    fillColor: '#f4f4f4',
    fillOpacity: 1,
    showOutline: false,
    lineColor: '#c8c8c8',
    lineWidth: 1,
    lineOpacity: 0.65,
    beforeId: undefined
}