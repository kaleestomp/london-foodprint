import type { FC } from 'react'; //ReactNode
// import Divider from '@mui/material/Divider';

import GradeIcon from '@mui/icons-material/Grade';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import CurrencyPoundRoundedIcon from '@mui/icons-material/CurrencyPoundRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import SportsKabaddiRoundedIcon from '@mui/icons-material/SportsKabaddiRounded';
import GoogleIcon from '@mui/icons-material/Google';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRequestPlaceDetail from '../../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import PlaceBodySkeleton from './PlaceBodySkeleton';
import DetailRow from './DetailRow/DetailRow';

import { formatAddress } from '../../../../utils/format/formatAddress';
import { formatDistance } from '../../../../utils/format/formatMetrics';
import calculateDistanceM from '../../../../utils/geo/calculateDistanceM';
import formatOpeningTime from '../formatDetails/formatOpeningTime';
import formatChain from '../formatDetails/formatChain';
import formatRank from '../formatDetails/formatRank';
import formatRepresentation from '../formatDetails/formatRepresentation';


// import formatOpeningTime from '../formatOpeningTime';
// import getRankComment from './getRankComment';
import './PlaceBody.css';

const PlaceBody: FC<{ 
    placeId: string | null;
}> = ({ placeId }) => {

	const { searchMask } = useSearchFilters();
	const { status, res } = useRequestPlaceDetail(placeId);
    if (status === 'error') return null;
    const showSkeleton = status !== 'success' || !res;
    const place = showSkeleton ? null : res;
	if (!place) {
		return <PlaceBodySkeleton />;
	} 

	// FORMAT DETAILS
	// const cuisine = place.cuisine_type !== 'Unspecified' ? place.cuisine_type : null;
    const distanceM = place && searchMask?.center
        ? calculateDistanceM(searchMask?.center, { lat: place.lat, lng: place.lon }) : null;
    const labelDistance = formatDistance(distanceM);
	const chainStatus = formatChain(place.chain_name, place.chain_count, place.is_major_chain);
	const openingTime = formatOpeningTime(place.opening_time);
    const labelOpeningTime = openingTime ? openingTime.label : 'Closed'
	const rankStatus = formatRank(Number(place.ranking), Number(place.review_count));
	const representationStatus = formatRepresentation(Number(place.rep_delta), Number(place.local_rep_ratio), Number(place.local_total));
	const address = formatAddress(place.short_formatted_address, place.pcd);

	return (
		<div className="place-body" >
			<div className="place-body-rows">
				{labelDistance && <DetailRow key="distance" value={labelDistance} icon={<DirectionsWalkRoundedIcon />} />}
                {place.price && <DetailRow key="price" value={place.price} icon={<CurrencyPoundRoundedIcon />} />}
                {labelOpeningTime && <DetailRow key="openingTime" value={labelOpeningTime} icon={<AccessTimeFilledRoundedIcon />} />}
                {place.google_maps_uri && <DetailRow key="googleLink" value={'Map'} onClick={() => window.open(place.google_maps_uri ?? '_blank', '_blank')} icon={<GoogleIcon />} />}
                {place.website_uri && <DetailRow key="website" value={'Website'} onClick={() => window.open(place.website_uri ?? '_blank', '_blank')} icon={<LinkRoundedIcon />} />}
			</div>
			{/* <Divider className="place-body-divider" sx={{ margin: '4px 0' }} /> */}
			{chainStatus && <DetailRow key="chainStatus" value={chainStatus} icon={<StoreRoundedIcon />} />}
			{rankStatus && <DetailRow key="rankStatus" value={rankStatus} icon={Number(place.ranking) <= 0.45 ? <GradeIcon /> : <ThumbDownAltIcon />} />}
			{representationStatus && <DetailRow key="representationStatus" value={representationStatus} icon={<SportsKabaddiRoundedIcon />} />}
			{address && <DetailRow key="address" value={address} icon={<LocationOnRoundedIcon />} />}

		</div>
	);
};

export default PlaceBody;
