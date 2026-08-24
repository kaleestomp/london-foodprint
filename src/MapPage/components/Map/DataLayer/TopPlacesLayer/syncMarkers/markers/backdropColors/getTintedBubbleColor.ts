const WHITE_BLEND_FACTOR = 0.64;
const COLOR_SAMPLE_MAX_SIZE = 32;
const iconBubbleColorCache = new Map<string, Promise<string | null>>();

type Rgb = { r: number; g: number; b: number };

const blendChannelWithWhite = (value: number): number => (
  Math.round((value * (1 - WHITE_BLEND_FACTOR)) + (255 * WHITE_BLEND_FACTOR))
);

const rgbToCss = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

const getAverageIconColor = (iconSrc: string): Promise<Rgb | null> => (
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      const maxDimension = Math.max(image.naturalWidth, image.naturalHeight);
      if (!maxDimension) {
        resolve(null);
        return;
      }

      const scale = Math.min(1, COLOR_SAMPLE_MAX_SIZE / maxDimension);
      const sampleWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const sampleHeight = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

      let weightedR = 0;
      let weightedG = 0;
      let weightedB = 0;
      let totalWeight = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        if (alpha <= 0.05) continue;

        weightedR += data[i] * alpha;
        weightedG += data[i + 1] * alpha;
        weightedB += data[i + 2] * alpha;
        totalWeight += alpha;
      }

      if (!totalWeight) {
        resolve(null);
        return;
      }

      resolve({
        r: Math.round(weightedR / totalWeight),
        g: Math.round(weightedG / totalWeight),
        b: Math.round(weightedB / totalWeight),
      });
    };

    image.onerror = () => resolve(null);
    image.src = iconSrc;
  })
);

const getTintedBubbleColor = (iconSrc: string): Promise<string | null> => {
  const cached = iconBubbleColorCache.get(iconSrc);
  if (cached) return cached;

  const pending = getAverageIconColor(iconSrc)
    .then((avg) => {
      if (!avg) return null;
      return rgbToCss({
        r: blendChannelWithWhite(avg.r),
        g: blendChannelWithWhite(avg.g),
        b: blendChannelWithWhite(avg.b),
      });
    })
    .catch(() => null);

  iconBubbleColorCache.set(iconSrc, pending);
  return pending;
};

export default getTintedBubbleColor;
