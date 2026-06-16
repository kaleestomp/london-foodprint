import React, { useEffect, useRef, useState } from 'react'; 
// import useElementSize from '../../../utils/styling/observer';

const DEFAULT_CARD_WIDTH = Math.min(800, window.screen.width * 0.3);
const MIN_CARD_WIDTH = 250;
// const MAX_CARD_WIDTH = 800;

type UseResizeWidthReturn = {
    cardWidth: number;
    isResizing: boolean;
    onResizeStart: (event: React.MouseEvent) => void; 
};

const useResizeWidth = (): UseResizeWidthReturn => {

    const [cardWidth, setCardWidth] = useState<number>(DEFAULT_CARD_WIDTH);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const dragStartXRef = useRef<number>(0);
    const dragStartWidthRef = useRef<number>(DEFAULT_CARD_WIDTH);
    const rafIdRef = useRef<number | null>(null);
    const pendingWidthRef = useRef<number>(DEFAULT_CARD_WIDTH);

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            if (!isResizing) return;
            
            // Dragging right increases width; dragging left decreases it.
            const deltaX = event.clientX - dragStartXRef.current;
            const nextWidth = dragStartWidthRef.current + deltaX;
            const clampedWidth = Math.max(MIN_CARD_WIDTH, Math.min(nextWidth, window.innerWidth));
            pendingWidthRef.current = clampedWidth;
            if (rafIdRef.current == null) {
                rafIdRef.current = window.requestAnimationFrame(() => {
                    setCardWidth(pendingWidthRef.current);
                    rafIdRef.current = null;
                });
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            setIsResizing(false);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [isResizing, window.innerWidth]);

    const onResizeStart = (event: React.MouseEvent) => {
        event.preventDefault();
        dragStartXRef.current = event.clientX;
        dragStartWidthRef.current = cardWidth;
        setIsResizing(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
    };

    return { cardWidth, isResizing, onResizeStart };
};

export default useResizeWidth;
