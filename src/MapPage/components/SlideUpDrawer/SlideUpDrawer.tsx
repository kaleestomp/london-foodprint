import { type FC } from 'react';
import { Drawer } from 'vaul';
import type maplibregl from 'maplibre-gl';

// import SampleContent from './SampleContent/SampleContent';
import Header from './Header/Header';
import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './SlideUpDrawer.css';

export const SNAP_HEIGHTS = ['94px', 0.5, `${window.innerHeight - 104}px`];//64

const SlideUpDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();
  // const [snap, setSnap] = useState<number | string | null>(SNAP_HEIGHTS[0]);
  // useEffect(() => {
  //   reportSnap(snap); // used to track avatar home position
  // }, [snap]);

  return (
    <Drawer.Root
      defaultOpen={true} dismissible={false} modal={false}
      snapPoints={SNAP_HEIGHTS} activeSnapPoint={snap}
      setActiveSnapPoint={updateSnap} snapToSequentialPoint={false}
      fadeFromIndex={2} handleOnly={true} 
      //onDragPositionChange={(visibleHeight) => void}
    >
      <Drawer.Portal>
        {/* <Drawer.Overlay className="vaul-overlay" /> */}
        <div className={`vaul-overlay${isAtFullHeight ? ' is-visible' : ''}`} />
        <Drawer.Content data-testid="content" className="vaul-content">
          <AboveDrawer mapRef={mapRef} />
          <div className={`vaul-drawer-body${isAtFullHeight ? ' is-full-height' : ''}`}>
            <Drawer.Handle className="vaul-handle" />
            <div className="vaul-handle-visual" aria-hidden="true" />
            <Header />
            {/* <SampleContent snap={snap} /> */}
            <Content panelUp={!isClosed} mapRef={mapRef}/>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SlideUpDrawer;