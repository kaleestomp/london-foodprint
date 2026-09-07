import { type FC } from 'react';
import { Drawer } from 'vaul';
import type maplibregl from 'maplibre-gl';

// import SampleContent from './SampleContent/SampleContent';
import Header from './Header/Header';
import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './SlideUpDrawer.css';

export const SNAP_HEIGHTS = ['94px', 0.4, `${window.innerHeight - 28}px`];//200px 94px 320px 104px

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();

  return (
    <Drawer.Root
      defaultOpen={true} dismissible={false} modal={false}
      snapPoints={SNAP_HEIGHTS} activeSnapPoint={snap}
      setActiveSnapPoint={updateSnap} snapToSequentialPoint={false}
      fadeFromIndex={2} handleOnly={true} repositionInputs={false}
    >

      <Drawer.Portal>
        <div className={`vaul-overlay${isAtFullHeight ? ' is-visible' : ''}`} />
        <Drawer.Content data-testid="content" className="vaul-content">
          <AboveDrawer mapRef={mapRef} />
          <div className={`vaul-drawer-body${isAtFullHeight ? ' is-full-height' : !isClosed ? ' is-open' : ''}`}>
            <Drawer.Handle className="vaul-handle" />
            <div className="vaul-handle-visual" aria-hidden="true" />
            <Header />
            {/* <SampleContent snap={snap} /> */}
            <Content panelUp={!isClosed} mapRef={mapRef} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>

    </Drawer.Root>
  );
};

export default SlideUpDrawer;