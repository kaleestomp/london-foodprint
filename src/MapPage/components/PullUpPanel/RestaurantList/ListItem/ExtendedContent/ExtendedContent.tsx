import type { FC } from 'react';
import './ExtendedContent.css';

const ExtendedContent: FC<{
  googleMapsUri?: string | null;
  websiteUri?: string | null;
}> = ({ googleMapsUri, websiteUri }) => (
  
  <div className="list-item-links">
    {googleMapsUri && (
      <a href={googleMapsUri} target="_blank" rel="noreferrer">Map</a>
    )}
    {websiteUri && (
      <a href={websiteUri} target="_blank" rel="noreferrer">Website</a>
    )}
  </div>
);

export default ExtendedContent;
