import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';
import calculateDistanceM from '../../../../utils/geo/calculateDistanceM';

// Fields absent from the place-detail response are not rendered by ListItem when null.
const parseToPlacesListItem = (
  item: {
    id: string;
    lat: number;
    lon: number;
    ranking: number | null;
    display_name: string;
    cuisine_type: string | null;
    price: string | null;
    is_chain: boolean | null;
    is_major_chain: boolean | null;
    venue_type: string | null;
    google_maps_uri: string | null;
    website_uri: string | null;
  },
  refPoint?: { lat: number; lng: number }
): PlacesListItem => {

  const distance_m = refPoint
    ? calculateDistanceM(refPoint, { lat: item.lat, lng: item.lon })
    : null;
  const placeListItem = {...item, distance_m: distance_m };

  return placeListItem;
};

export default parseToPlacesListItem;