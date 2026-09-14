import type { FC, ReactNode } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import BusinessIcon from '@mui/icons-material/Business';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import LinkIcon from '@mui/icons-material/Link';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NumbersIcon from '@mui/icons-material/Numbers';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SellIcon from '@mui/icons-material/Sell';
import StarIcon from '@mui/icons-material/Star';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TagIcon from '@mui/icons-material/Tag';
import CurrencyPoundRoundedIcon from '@mui/icons-material/CurrencyPoundRounded';

import type { PlaceDetailResponse } from '../../../request/useRequestPlaceDetail/request';
import useRequestPlaceDetail from '../../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import formatOpeningTime from '../formatOpeningTime';
import PlaceDetailBodySkeleton from './PlaceDetailBodySkeleton';
import DetailRow from './DetailRow/DetailRow';
import getRankComment from './getRankComment';
import './PlaceDetailBody.css';

const valueOrDash = (value: ReactNode): ReactNode => value ?? '—';

const PlaceDetailBody: FC<{ 
    placeId: string 
}> = ({ placeId }) => {

    const { status, res } = useRequestPlaceDetail(placeId);
    const showSkeleton = status !== 'success' || !res;
    const item = showSkeleton ? null : res as PlaceDetailResponse;

	if (!item) {
		return <PlaceDetailBodySkeleton />;
	}
    const rankComment = item.ranking ? getRankComment(item.ranking, item.review_count) : null;

	const openingTime = item ? formatOpeningTime(item.opening_time) : null;
	const rows: Array<{ label: string; value: ReactNode; icon: ReactNode }> = [
		// { label: 'Ranking', value: item.ranking, icon: <StarIcon /> },
		{ label: 'Price', value: item.price, icon: <SellIcon /> },
		// { label: 'Local representation ratio', value: item.local_rep_ratio, icon: <CallSplitIcon /> },
		// { label: 'Local representation total', value: item.local_total, icon: <NumbersIcon /> },
		// { label: 'Representation delta', value: item.rep_delta, icon: <CallSplitIcon /> },
		// { label: 'Postcode', value: item.pcd, icon: <LocationOnIcon /> },
		// { label: 'Chain count', value: item.chain_count, icon: <NumbersIcon /> },
		// { label: 'Chain name', value: item.chain_name, icon: <BusinessIcon /> },
		// { label: 'Chain', value: item.is_chain == null ? null : item.is_chain ? 'Yes' : 'No', icon: <BusinessIcon /> },
		// { label: 'Major chain', value: item.is_major_chain == null ? null : item.is_major_chain ? 'Yes' : 'No', icon: <BusinessIcon /> },
		// { label: 'Venue type', value: item.venue_type, icon: <StorefrontIcon /> },
		// { label: 'Address', value: item.short_formatted_address, icon: <LocationOnIcon /> },
		// { label: 'Reviews', value: item.review_count, icon: <NumbersIcon /> },
		// { label: 'Opening hours', value: openingTime ? `${openingTime.label} (${openingTime.openAt} - ${openingTime.closeAt})` : null, icon: <ScheduleIcon /> },
		// { label: 'Google Maps', value: item.google_maps_uri ? <a href={item.google_maps_uri} target="_blank" rel="noreferrer">Open map <OpenInNewIcon /></a> : null, icon: <LinkIcon /> },
	];

	return (
		<div className="place-detail-body">
            <DetailRow key="price" value={item.price} icon={<CurrencyPoundRoundedIcon />} />
			{/* {rows.map(({ label, value, icon }) => (
				<DetailRow key={label} label={label} value={value} icon={icon} />
			))} */}
		</div>
	);
};

export default PlaceDetailBody;
