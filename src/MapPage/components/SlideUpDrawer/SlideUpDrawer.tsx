import { type FC } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import type maplibregl from 'maplibre-gl';

// import SampleContent from './SampleContent/SampleContent';
import Header from './Header/Header';
import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './SlideUpDrawer.css';

export const SNAP_HEIGHTS = ['104px', '410px', `${window.innerHeight - 96}px`];//200px 94px 320px 104px ${window.innerHeight - 28}px

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();

  return (
    <Drawer.Root
      open={true}
      onOpenChange={() => undefined}
      disablePointerDismissal
      modal={false}
      snapPoints={SNAP_HEIGHTS}
      snapPoint={snap}
      onSnapPointChange={updateSnap}
      snapToSequentialPoints
    >

      <Drawer.Portal>
        <Drawer.Backdrop className={`base-ui-overlay${isAtFullHeight ? ' is-visible' : ''}`} />
        <Drawer.Viewport className="base-ui-viewport">
          <Drawer.Popup data-testid="content" className={
            `base-ui-content${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`
            }>
          <AboveDrawer mapRef={mapRef} />
          <div className={`base-ui-drawer-body${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`}>
            <div className="base-ui-handle" aria-hidden="true" />
            <Drawer.Content className="base-ui-drawer-content">
              <Header />
              {/* <SampleContent snap={snap} /> */}
              <Content panelUp={!isClosed} mapRef={mapRef} />
            </Drawer.Content>
          </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>

    </Drawer.Root>
  );
};

export default SlideUpDrawer;