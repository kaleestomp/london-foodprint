import type { FC } from 'react';
import type * as maplibregl from 'maplibre-gl';

import Header from '../SlideUpDrawer/Header/Header';
import Content from '../SlideUpDrawer/Content/Content';
import GeoSearchbar from '../GeoSearch/GeoSearchbar';
import DesktopPanelTabs from './DesktopPanelTabs';

import './DesktopPanel.css';

const DesktopPanel: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  return (
    <aside className="desktop-panel" aria-label="Places and filters">
      <header className="desktop-panel-header">

        <Header />
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