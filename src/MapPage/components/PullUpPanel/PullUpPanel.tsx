import { memo, type FC } from 'react';
import type L from 'leaflet';

import PullUpPanelMobile from './Mobile/PullUpPanelMobile';
import PullUpPanelDesktop from './Desktop/PullUpPanelDesktop';
import { useIsMobileCtx } from '../../../context/IsMobileContext';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};
const PullUpPanel: FC<Props> = ({ mapRef }) => {
  const isMobile = useIsMobileCtx();

  return isMobile ? (
    <PullUpPanelMobile mapRef={mapRef} />
  ) : (
    <PullUpPanelDesktop />
  );
};

export default memo(PullUpPanel);
