import { createPortal } from 'react-dom';
import { type FC, type RefObject } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import type maplibregl from 'maplibre-gl';

import DashedCircle from '../Searchmask/DashedCircle';
import Badge from '../Badge/Badge';
import useDragRestaurantCount from '../Badge/useDragRestaurantCount';
import './DropRing.css';

const DropRing: FC<{
    mapRef: RefObject<maplibregl.Map | null>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    isActive: boolean;
}> = ({ mapRef, pointer, isActive }) => {

    const { count: dragRestaurantCount, isLoading: isDragCountLoading } = useDragRestaurantCount({ mapRef, pointer, isActive });
    
    if (!isActive || typeof document === 'undefined') return null;
    return createPortal(
        <div className="bubble-avatar-root">
            <motion.div className="drop-ring-shell" style={{ left: pointer.x, top: pointer.y }}>
                <DashedCircle className="drop-ring" />
                <Badge count={dragRestaurantCount} isLoading={isDragCountLoading} />
            </motion.div>
        </div>
        ,document.body
    );
};

export default DropRing;
