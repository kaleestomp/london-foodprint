import type { FC } from 'react';
import StoreIcon from '@mui/icons-material/Store';
import TableBarIcon from '@mui/icons-material/TableBar';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import GoogleIcon from '@mui/icons-material/Google';
import LanguageIcon from '@mui/icons-material/Language';

import type { PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import './ExtendedContent.css';

const ExtendedContent: FC<{
  item: PlacesListItem;
}> = ({ item }) => {

  return (
    <div
      className="list-item-extra"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="list-item-extended-row">
        {typeof item.is_chain === 'boolean' && item.is_chain
          ? <><StoreIcon /> Chain </> : null
        }
        {typeof item.venue_type === 'string' 
          ? (item.venue_type.toLowerCase() === 'dine-in' ? <><TableBarIcon /> DineIn </> 
          : <><TakeoutDiningIcon /> Takeout </>) : null
        }
        {/* {item.website_uri && (
          <a
            href={item.website_uri}
            target="_blank"
            rel="noreferrer"
            aria-label="Open website"
            title="Open website"
          >
            <LanguageIcon />
            Web
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
            <GoogleIcon />
            Map
          </a>
        )} */}
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
            <LanguageIcon />
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
            <GoogleIcon /> Map
          </a>
        )}
      </div>
    </div>

  )
};

export default ExtendedContent;
