import type { FC } from 'react';
import StoreIcon from '@mui/icons-material/Store';
import TableBarIcon from '@mui/icons-material/TableBar';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import GoogleIcon from '@mui/icons-material/Google';
import LanguageIcon from '@mui/icons-material/Language';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';

import IconPair from './IconPair';
import { formatWalkDistance, formatDistance } from '../formatMetrics';
import type { PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import './ExtendedContent.css';

const ExtendedContent: FC<{
  item: PlacesListItem;
}> = ({ item }) => {

  const walkMins = formatWalkDistance(item.distance_m);
  const distance = formatDistance(item.distance_m);

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
          ? <IconPair icon={<DirectionsWalkIcon fontSize="small" />} text={`${walkMins} | ${distance}`} />
          : null
        }
        {item.price
          ? <IconPair icon={<CurrencyPoundIcon fontSize="small" />} text={item.price} />
          : null
        }
        
      </div>
      <div className="list-item-links">
        
        {item.website_uri && (
          <a
            href={item.website_uri}
            target="_blank"
            rel="noreferrer"
            aria-label="Open website"
            title="Open website"
          >
            <LanguageIcon fontSize="small" />
          </a>
        )}
        {item.google_maps_uri && (
          <a
            href={item.google_maps_uri}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in Google Maps"
            title="Open in Google Maps"
          >
            <GoogleIcon fontSize="small" /> Map
          </a>
        )}
      </div>
    </div>

  )
};

export default ExtendedContent;
