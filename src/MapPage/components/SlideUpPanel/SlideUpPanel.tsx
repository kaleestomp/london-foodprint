import { useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import './SlideUpPanel.css';

const SNAP_RATIOS = [0.18, 0.42, 0.72] as const;
const MIN_PANEL_HEIGHT = 120;
const TOP_OFFSET = 32;

const clampHeight = (height: number, viewportHeight: number) => {
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, viewportHeight - TOP_OFFSET);
    return Math.min(Math.max(height, MIN_PANEL_HEIGHT), maxHeight);
};

const getSnapHeights = (viewportHeight: number) =>
    SNAP_RATIOS.map((ratio) => clampHeight(Math.round(viewportHeight * ratio), viewportHeight));

const getNearestSnap = (value: number, snapHeights: number[]) =>
    snapHeights.reduce((closest, snapHeight) => {
        if (Math.abs(snapHeight - value) < Math.abs(closest - value)) {
            return snapHeight;
        }

        return closest;
    }, snapHeights[0]);

const SlideUpPanel: React.FC = () => {
    const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
    const snapHeights = useMemo(() => getSnapHeights(viewportHeight), [viewportHeight]);
    const [panelHeight, setPanelHeight] = useState(() => getSnapHeights(window.innerHeight)[1]);
    const dragStateRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setViewportHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setPanelHeight((currentHeight) => getNearestSnap(clampHeight(currentHeight, viewportHeight), snapHeights));
    }, [snapHeights, viewportHeight]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        dragStateRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startHeight: panelHeight,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
        }

        const nextHeight = dragState.startHeight + (dragState.startY - event.clientY);
        setPanelHeight(clampHeight(nextHeight, viewportHeight));
    };

    const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
        }

        dragStateRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        setPanelHeight((currentHeight) => getNearestSnap(currentHeight, snapHeights));
    };

    return (
        <Drawer
            anchor="bottom"
            open
            variant="persistent"
            hideBackdrop
            slotProps={{
                paper: {
                    className: 'slide-up-panel',
                    sx: {
                        height: `${panelHeight}px`,
                    },
                },
            }}
        >
            <div
                className="slide-up-panel-handle-zone"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
            >
                <div className="slide-up-panel-handle" />
            </div>

            <Box className="slide-up-panel-content">
                <Stack spacing={2.5} sx={{ p: 2.5 }}>
                    <Typography variant="overline" className="slide-up-panel-label">
                        MUI drawer example
                    </Typography>
                    <Typography variant="h6">Draggable bottom sheet with snap points</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Drag the handle to resize the panel. When you release it, the drawer snaps to the nearest preset height.
                    </Typography>

                    <Stack direction="row" spacing={1} className="slide-up-panel-snap-row">
                        {snapHeights.map((snapHeight) => (
                            <Button
                                key={snapHeight}
                                size="small"
                                variant={panelHeight === snapHeight ? 'contained' : 'outlined'}
                                onClick={() => setPanelHeight(snapHeight)}
                            >
                                {snapHeight}px
                            </Button>
                        ))}
                    </Stack>

                    <Box className="slide-up-panel-demo-card">
                        <Typography variant="subtitle2">Current height</Typography>
                        <Typography variant="h4">{panelHeight}px</Typography>
                        <Typography variant="body2" color="text.secondary">
                            In production, replace this content with filters, place details, or map actions.
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        </Drawer>
    );
};

export default SlideUpPanel;

