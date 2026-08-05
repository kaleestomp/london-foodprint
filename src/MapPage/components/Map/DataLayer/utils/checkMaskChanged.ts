import { useRef } from 'react';
import { type SearchMask } from '../LayerStates/maskResults';

/**
 * Hook that owns a ref tracking the previous search mask and returns
 * whether the mask has changed.
 */
const useCheckMaskChanged = () => {
  const prevMaskRef = useRef<SearchMask | null>(null);

  const checkMaskChanged = (searchMask: SearchMask | null): boolean => {
    const prev = prevMaskRef.current;
    prevMaskRef.current = searchMask;
    if (!prev && !searchMask) return false;
    if (!prev || !searchMask) return true;
    return (
      prev.radiusM !== searchMask.radiusM ||
      prev.center.lat !== searchMask.center.lat ||
      prev.center.lng !== searchMask.center.lng
    );
  };

  return { checkMaskChanged, prevMaskRef };
};

export default useCheckMaskChanged;
