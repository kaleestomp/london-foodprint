import type { FC } from 'react';
import SkeletonCard from './SkeletonCard';

const ListLoading: FC<{ 
  enabled: boolean, 
  rowCount?: number 
}> = ({ enabled, rowCount = 8 }) => {

  if (!enabled) return null;

  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </>
  );
};

export default ListLoading;
