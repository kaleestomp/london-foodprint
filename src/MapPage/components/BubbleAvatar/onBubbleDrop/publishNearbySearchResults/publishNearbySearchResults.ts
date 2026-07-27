// import { useEffect } from 'react';

// import { type NearbyResponse } from '../../../../request/useRequestNearby/request';
// import aggregateCuisine from './aggregateCuisine';
// import aggregatePrice from './aggregatePrice';
// import aggregateRank from './aggregateRank';

// const useNearbyPlaceHistograms = (
//   nearbyRes: NearbyResponse | null,
// ) => {
  
//   useEffect(() => {
//     const priceHistogram = aggregatePrice(nearbyRes);
//     const cuisineHistogram = aggregateCuisine(nearbyRes);
//     const rankHistogram = aggregateRank(nearbyRes);

//   }, [nearbyRes]);
// };

// export default useNearbyPlaceHistograms;