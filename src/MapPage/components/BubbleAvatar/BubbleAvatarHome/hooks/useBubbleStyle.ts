import { useMemo } from 'react';
import type { CSSProperties } from 'react';

type Point = { x: number; y: number };

export type BubbleStyleKeyword = 'default' | 'pickup' | 'raw-drag';

type Args = {
  style: BubbleStyleKeyword | undefined;
  pickupPos: Point | null;
  dragPos: Point | null;
};

const useBubbleStyle = ({ style: styleKeyword, pickupPos, dragPos }: Args): CSSProperties | undefined => {
  return useMemo(() => {
    if (styleKeyword === 'pickup' && pickupPos) {
      return {
        bottom: 'auto',
        left: `calc(${pickupPos.x}px - (var(--bubble-avatar-home-size) / 2))`,
        top: `calc(${pickupPos.y}px - (var(--bubble-avatar-home-size) / 2))`,
        marginLeft: 0,
      };
    }

    if (styleKeyword === 'raw-drag' && dragPos) {
      return {
        bottom: 'auto',
        left: `calc(${dragPos.x}px - (var(--bubble-avatar-home-size) / 2))`,
        top: `calc(${dragPos.y}px - (var(--bubble-avatar-home-size) / 2))`,
        marginLeft: 0,
      };
    }

    return undefined;
  }, [styleKeyword, pickupPos, dragPos]);
};

export default useBubbleStyle;