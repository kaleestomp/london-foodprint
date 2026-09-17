import type { FC } from 'react';
import StoreIcon from '@mui/icons-material/Store';
import TableBarIcon from '@mui/icons-material/TableBar';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import GoogleIcon from '@mui/icons-material/Google';
import LanguageIcon from '@mui/icons-material/Language';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';

import IconPair from './IconPair';
import { formatWalkDistance, formatDistance } from '../../../../../../utils/format/formatMetrics';
import type { PlaceDetailResponse } from '../../../../../request/useRequestPlaceDetail/request';
import type { PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import { usePlaceDetailCardState } from '../../../../../../context/PlaceDetailCardContext';
import './ExtendedContent.css';

const ExtendedContent: FC<{
  item: PlaceDetailResponse | PlacesListItem;
  distance?: number | null;
}> = ({ item, distance }) => {
  const { reportPlaceIdforDetail } = usePlaceDetailCardState();

  const walkMins = formatWalkDistance(distance);
  const distanceM = formatDistance(distance);

  return (
    <div className="list-item-extra">
      
      <div className="list-item-extended-row">
        {typeof item.is_chain === 'boolean' && item.is_chain
          ? <IconPair icon={<StoreIcon fontSize="small" />} text="Chain" />
          : null
        }
        {typeof item.venue_type === 'string' 
          ? (
            item.venue_type.toLowerCase() === 'dine-in'
              ? <IconPair icon={<TableBarIcon fontSize="small" />} text="DineIn" />
              : <IconPair icon={<TakeoutDiningIcon fontSize="small" />} text="Takeout" />
          )
          : null
        }
        {walkMins
          ? <IconPair icon={<DirectionsWalkIcon fontSize="small" />} text={`${walkMins} | ${distanceM}`} />
          : null
        }
        {item.price
          ? <IconPair icon={<CurrencyPoundIcon fontSize="small" />} text={item.price} />
          : null
        }
        
      </div>
      <div className="list-item-links">

        <IconButton
          className="list-item-info-button"
          size="small"
          type="button"
          aria-label="Show more place details"
          title="Show more place details"
          onClick={(event) => {
            event.stopPropagation();
            reportPlaceIdforDetail(item.id, false);
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
        
        {item.website_uri && (
          <IconButton
            className="list-item-link-button"
            component="a"
            size="small"
            href={item.website_uri}
            target="_blank"
            rel="noreferrer"
            aria-label="Open website"
            title="Open website"
          >
            <LanguageIcon fontSize="small" />
          </IconButton>
        )}
        {item.google_maps_uri && (
          <IconButton
            className="list-item-link-button"
            component="a"
            size="small"
            href={item.google_maps_uri}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in Google Maps"
            title="Open in Google Maps"
          >
            <GoogleIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    </div>

  )
};

export default ExtendedContent;
