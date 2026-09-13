import type { FC } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../context/IsMobileContext';
import DrawerHeader from '../SlideUpDrawer/DrawerHeader/DrawerHeader';
import Content from '../SlideUpDrawer/Content/Content';
import GeoSearchbar from '../GeoSearchbarMaptiler/GeoSearchbar';
import DesktopPanelTabs from './DesktopPanelTabs';

import './DesktopPanel.css';

const DesktopPanel: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {
  const isMobile = useIsMobileCtx();

  if (isMobile) return null;

  return (
    <aside className="desktop-panel" aria-label="Places and filters">
      <header className="desktop-panel-header">

        <DrawerHeader />
        <div className="desktop-panel-search">
          <GeoSearchbar />
        </div>
        <DesktopPanelTabs />

      </header>
      <div className="desktop-panel-body">
        <Content panelUp={true} mapRef={mapRef} />
      </div>
    </aside>
  );
};

export default DesktopPanel;