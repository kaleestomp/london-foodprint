import { type NearbyResponse } from '../../../../request/useRequestNearby/request';

export type RankHistogramBucket = 1 | 2 | 3 | 4 | 'unranked';
export interface RankHistogramEntry {
  bucket: RankHistogramBucket;
  count: number;
  label: string;
}

const rankBuckets: Array<{ bucket: RankHistogramBucket; label: string }> = [
  { bucket: 1, label: 'Better than Average' },
  { bucket: 2, label: 'Top 25% of Establishments' },
  { bucket: 3, label: 'Top 10% of Establishments' },
  { bucket: 4, label: 'Top 5% of Establishments' },
  { bucket: 'unranked', label: 'Unranked' },
];

const aggregateRank = (
  nearbyRes: NearbyResponse | null,
): RankHistogramEntry[] => {

  const rankCounts = new Map<RankHistogramBucket, number>(
    rankBuckets.map(({ bucket }) => [bucket, 0]),
  );

  for (const place of nearbyRes?.data ?? []) {
    const bucket = place.rank == null || ![1, 2, 3, 4].includes(place.rank)
      ? 'unranked'
      : place.rank as 1 | 2 | 3 | 4;
    rankCounts.set(bucket, (rankCounts.get(bucket) ?? 0) + 1);
  }

  const rankHistogram = rankBuckets.map(({ bucket, label }) => ({
    bucket,
    count: rankCounts.get(bucket) ?? 0,
    label,
  }));

  return rankHistogram;
};

export default aggregateRank;