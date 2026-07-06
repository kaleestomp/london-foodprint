import { useMemo } from 'react';
import type { CSSProperties } from 'react';

type Point = { x: number; y: number };

type HomeCenter = Point;

export type BubbleStyleKeyword = 'default' | 'mobile-home' | 'pickup';

type Args = {
  style: BubbleStyleKeyword | undefined;
  homeCenter: HomeCenter | null;
  pickupPos: Point | null;
};

const useBubbleStyle = ({ style: styleKeyword, homeCenter, pickupPos }: Args): CSSProperties | undefined => {
  return useMemo(() => {
    if (styleKeyword === 'mobile-home' && homeCenter) {
      return {
        bottom: 'auto',
        top: `calc(${homeCenter.y}px - (var(--bubble-avatar-home-size) / 2))`,
      };
    }

    if (styleKeyword === 'pickup' && pickupPos) {
      return {
        bottom: 'auto',
        left: `calc(${pickupPos.x}px - (var(--bubble-avatar-home-size) / 2))`,
        top: `calc(${pickupPos.y}px - (var(--bubble-avatar-home-size) / 2))`,
        marginLeft: 0,
      };
    }

    return undefined;
  }, [styleKeyword, homeCenter, pickupPos]);
};

export default useBubbleStyle;