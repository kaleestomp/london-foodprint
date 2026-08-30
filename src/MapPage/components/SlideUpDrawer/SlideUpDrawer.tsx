'use client';
import { type FC, useState, useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import { Drawer } from 'vaul';

// import SampleContent from './SampleContent/SampleContent';
import Header from './Header/Header';
// import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './SlideUpDrawer.css';

const SNAP_HEIGHTS = ['64px', 0.5, `${window.innerHeight - 64}px`];

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const { isAtFullHeight, reportIsAtFullHeight, reportSnap } = useDrawerState();
  const [snap, setSnap] = useState<number | string | null>(SNAP_HEIGHTS[0]);
  useEffect(() => { 
    reportSnap(snap); // used to track avatar home position
    reportIsAtFullHeight(snap === SNAP_HEIGHTS[2]);
    // isFullHeight is used to conditionally fade out avatar
  }, [snap]);

  return (
    <Drawer.Root
      defaultOpen={true} dismissible={false} modal={false}
      snapPoints={SNAP_HEIGHTS} activeSnapPoint={snap}
      setActiveSnapPoint={setSnap} snapToSequentialPoint={true}
      fadeFromIndex={2}
    // onDragPositionChange={(visibleHeight) => void}
    >
      <Drawer.Portal>
        {/* <Drawer.Overlay className="vaul-overlay" /> */}
        <div className={`vaul-overlay${isAtFullHeight ? ' is-visible' : ''}`} />
        <Drawer.Content data-testid="content" className="vaul-content">
          <AboveDrawer mapRef={mapRef} />
          <div className={`vaul-drawer-body${isAtFullHeight ? ' is-full-height' : ''}`}>
            <Drawer.Handle className="vaul-handle" />
            <Header />
            {/* <SampleContent snap={snap} /> */}
            {/* <Content /> */}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SlideUpDrawer;