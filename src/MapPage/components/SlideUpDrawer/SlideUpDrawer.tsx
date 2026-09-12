import { type FC, useState } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import type * as maplibregl from 'maplibre-gl';

// import SampleContent from './SampleContent/SampleContent';
import DrawerHeader from './DrawerHeader/DrawerHeader';
import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './Styling/drawerRoot.css';

export const SNAP_HEIGHTS = ['104px', '410px', `${window.innerHeight - 96}px`];//200px 94px 320px 104px ${window.innerHeight - 28}px

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const [drawerContainer, setDrawerContainer] = useState<HTMLDivElement | null>(null);
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
      <div ref={setDrawerContainer} className={`base-ui-container${isAtFullHeight ? ' is-full-height' : isClosed ? '' : ' is-open'}`}>
        {drawerContainer && <Drawer.Portal container={drawerContainer}>
          <Drawer.Backdrop className={`base-ui-overlay${isAtFullHeight ? ' is-visible' : ''}`} />
          <Drawer.Viewport className="base-ui-viewport">
            <Drawer.Popup data-testid="content" className={
              `base-ui-popup${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`
              }>
            <AboveDrawer mapRef={mapRef} />
            <div className={`base-ui-drawer-body${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`}>
              <div className="base-ui-handle" aria-hidden="true" />
              <Drawer.Content className="base-ui-drawer-content">
                <DrawerHeader />
                {/* <SampleContent snap={snap} /> */}
                <Content panelUp={!isClosed} mapRef={mapRef} />
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