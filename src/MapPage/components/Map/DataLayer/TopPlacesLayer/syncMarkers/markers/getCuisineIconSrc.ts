import { CUISINE_DISPLAY } from '../../../../../../../utils/format/formatCuisines';

const iconAssets = import.meta.glob('../../../../../../../assets/icon_cuisines/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const iconByName = new Map<string, string>();
for (const [assetPath, assetUrl] of Object.entries(iconAssets)) {
  const fileName = assetPath.split('/').pop() ?? '';
  const baseName = fileName.replace(/\.png$/i, '').toLowerCase();
  iconByName.set(baseName, assetUrl);
}
const getCuisineIconSrc = (cuisineType?: string): string => {
  const displayName = cuisineType ? (CUISINE_DISPLAY[cuisineType] ?? 'Bistro') : 'Bistro';
  const normalizedName = displayName.toLowerCase();
  return iconByName.get(normalizedName) ?? iconByName.get('unspecified') ?? '';
};

export default getCuisineIconSrc;
