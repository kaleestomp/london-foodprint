import { memo, type FC } from 'react';
import type L from 'leaflet';

import PullUpPanelMobile from './Mobile/PullUpPanelMobile';
import PullUpPanelDesktop from './Desktop/PullUpPanelDesktop';
import { useAppUI } from '../../../context/AppUIContext';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};
const PullUpPanel: FC<Props> = ({ mapRef }) => {
  const { isMobile } = useAppUI();

  return isMobile ? (
    <PullUpPanelMobile mapRef={mapRef} />
  ) : (
    <PullUpPanelDesktop />
  );
};

export default memo(PullUpPanel);
