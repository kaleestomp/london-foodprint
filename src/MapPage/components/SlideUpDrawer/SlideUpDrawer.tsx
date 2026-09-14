import { type FC, useState } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import type * as maplibregl from 'maplibre-gl';

// import SampleContent from './SampleContent/SampleContent';
import DrawerHeader from './DrawerHeader/DrawerHeader';
import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import DrawerOverlay from './DrawerOverlay';
import { useDrawerState } from './DrawerStateContext';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { RenderedListProvider } from '../RestaurantList/RenderedListContext';

import './Styling/drawerRoot.css';

export const SNAP_HEIGHTS = ['104px', '400px', `${window.innerHeight - 96}px`];//200px 94px 320px 104px ${window.innerHeight - 28}px

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const isMobile = useIsMobileCtx();
  const [drawerContainer, setDrawerContainer] = useState<HTMLDivElement | null>(null);
  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();

  if (!isMobile) return null;

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
      <DrawerOverlay isVisible={isAtFullHeight} />
      <div ref={setDrawerContainer} className={`base-ui-container${isAtFullHeight ? ' is-full-height' : isClosed ? '' : ' is-open'}`}>
        {drawerContainer && <Drawer.Portal container={drawerContainer}>
          {/* <Drawer.Backdrop className="base-ui-drawer-backdrop" /> */}
          <Drawer.Viewport className="base-ui-viewport">
            <Drawer.Popup data-testid="content" className={
              `base-ui-popup${isAtFullHeight ? ' is-full-height' 
                : !isClosed ? ' is-open' : ''}`
              }>
            <AboveDrawer mapRef={mapRef} />
            <div className={`base-ui-drawer-body${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`}>
              <div className="base-ui-handle" aria-hidden="true" />
              <Drawer.Content className="base-ui-drawer-content">
                <RenderedListProvider>
                  <DrawerHeader />
                  {/* <SampleContent snap={snap} /> */}
                  <Content panelUp={!isClosed} mapRef={mapRef} />
                </RenderedListProvider>
              </Drawer.Content>
            </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>}
      </div>
    </Drawer.Root>
  );
};

export default SlideUpDrawer;