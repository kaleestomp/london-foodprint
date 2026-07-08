import type { FC } from 'react';
import type L from 'leaflet';

import PullUpPanelMobile from './Mobile/PullUpPanelMobile';
import PullUpPanelDesktop from './Desktop/PullUpPanelDesktop';
import useIsMobile from '../../../utils/browser/useIsMobile';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};
const PullUpPanel: FC<Props> = ({ mapRef }) => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <PullUpPanelMobile mapRef={mapRef} />
  ) : (
    <PullUpPanelDesktop />
  );
};

export default PullUpPanel;
