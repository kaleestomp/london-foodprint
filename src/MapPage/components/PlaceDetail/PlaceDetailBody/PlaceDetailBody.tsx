import type { FC } from 'react'; //ReactNode
import Divider from '@mui/material/Divider';
import CurrencyPoundRoundedIcon from '@mui/icons-material/CurrencyPoundRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import RamenDiningRoundedIcon from '@mui/icons-material/RamenDiningRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import calculateDistanceM from '../../../../utils/geo/calculateDistanceM';
import { formatDistance } from '../../../../utils/format/formatMetrics';
import formatOpeningTime from '../formatOpeningTime';

import type { PlaceDetailResponse } from '../../../request/useRequestPlaceDetail/request';
// import formatOpeningTime from '../formatOpeningTime';
import PlaceDetailBodySkeleton from './PlaceDetailBodySkeleton';
import DetailRow from './DetailRow/DetailRow';
// import getRankComment from './getRankComment';
import './PlaceDetailBody.css';

// const valueOrDash = (value: ReactNode): ReactNode => value ?? '—';

const PlaceDetailBody: FC<{ 
    place: PlaceDetailResponse 
}> = ({ place }) => {

	const { searchMask } = useSearchFilters();
    const distanceM = place && searchMask?.center
        ? calculateDistanceM(searchMask?.center, { lat: place.lat, lng: place.lon })
        : null;
    const labelDistance = formatDistance(distanceM);
	const chainStatus = place.is_major_chain ? 'Block Chain' : place.is_chain ? 'Chain' : null;
	
	const openingTime = formatOpeningTime(place.opening_time);
    const labelOpeningTime = openingTime ? openingTime.label : 'Closed'

	if (!place) {
		return <PlaceDetailBodySkeleton />;
	}
    // const rankComment = item.ranking ? getRankComment(item.ranking, item.review_count) : null;

	// const openingTime = item ? formatOpeningTime(item.opening_time) : null;
	// const rows: Array<{ label: string; value: ReactNode; icon: ReactNode }> = [
	// 	// { label: 'Ranking', value: item.ranking, icon: <StarIcon /> },
	// 	{ label: 'Price', value: item.price, icon: <SellIcon /> },
	// 	// { label: 'Local representation ratio', value: item.local_rep_ratio, icon: <CallSplitIcon /> },
	// 	// { label: 'Local representation total', value: item.local_total, icon: <NumbersIcon /> },
	// 	// { label: 'Representation delta', value: item.rep_delta, icon: <CallSplitIcon /> },
	// 	// { label: 'Postcode', value: item.pcd, icon: <LocationOnIcon /> },
	// 	// { label: 'Chain count', value: item.chain_count, icon: <NumbersIcon /> },
	// 	// { label: 'Chain name', value: item.chain_name, icon: <BusinessIcon /> },
	// 	// { label: 'Chain', value: item.is_chain == null ? null : item.is_chain ? 'Yes' : 'No', icon: <BusinessIcon /> },
	// 	// { label: 'Major chain', value: item.is_major_chain == null ? null : item.is_major_chain ? 'Yes' : 'No', icon: <BusinessIcon /> },
	// 	// { label: 'Venue type', value: item.venue_type, icon: <StorefrontIcon /> },
	// 	// { label: 'Address', value: item.short_formatted_address, icon: <LocationOnIcon /> },
	// 	// { label: 'Reviews', value: item.review_count, icon: <NumbersIcon /> },
	// 	// { label: 'Opening hours', value: openingTime ? `${openingTime.label} (${openingTime.openAt} - ${openingTime.closeAt})` : null, icon: <ScheduleIcon /> },
	// 	// { label: 'Google Maps', value: item.google_maps_uri ? <a href={item.google_maps_uri} target="_blank" rel="noreferrer">Open map <OpenInNewIcon /></a> : null, icon: <LinkIcon /> },
	// ];

	return (
		<div className="place-detail-body">
				{place.cuisine_type && <DetailRow key="cuisine" value={place.cuisine_type} icon={<RamenDiningRoundedIcon />} />}
			<div className="place-detail-body-rows">
				{labelDistance && <DetailRow key="distance" value={labelDistance} icon={<DirectionsWalkRoundedIcon />} />}
                {place.price && <DetailRow key="price" value={place.price} icon={<CurrencyPoundRoundedIcon />} />}
                {labelOpeningTime && <DetailRow key="openingTime" value={labelOpeningTime} icon={<AccessTimeFilledRoundedIcon />} />}

				{/* {rows.map(({ label, value, icon }) => (
					<DetailRow key={label} label={label} value={value} icon={icon} />
				))} */}
			</div>
			<Divider className="place-detail-body-divider" sx={{ margin: '16px 0' }} />
			{place.short_formatted_address && <DetailRow key="location" value={place.short_formatted_address} icon={<LocationOnRoundedIcon />} />}
			<Divider className="place-detail-body-divider" sx={{ margin: '16px 0' }} />
			<div className="place-detail-body-rows">
				{chainStatus && <DetailRow key="chainName" value={place.chain_name} icon={<StoreRoundedIcon />} />}
				{chainStatus && <DetailRow key="chainStatus" value={chainStatus} icon={<StoreRoundedIcon />} />}
			</div>
		</div>
	);
};

export default PlaceDetailBody;
