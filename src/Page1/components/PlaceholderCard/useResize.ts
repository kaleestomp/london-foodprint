import React, { useEffect, useRef, useState } from 'react';

const sh = window.screen.height;
const DEFAULT_CARD_HEIGHT = sh * 0.4;
const MIN_CARD_HEIGHT = 300;
const MAX_CARD_HEIGHT = sh;

type UseResizeReturn = {
    cardHeight: number;
    isResizing: boolean;
    onResizeStart: (event: React.MouseEvent) => void;
};

const useResize = (): UseResizeReturn => {

    const [cardHeight, setCardHeight] = useState<number>(DEFAULT_CARD_HEIGHT);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const dragStartYRef = useRef<number>(0);
    const dragStartHeightRef = useRef<number>(DEFAULT_CARD_HEIGHT);
    const rafIdRef = useRef<number | null>(null);
    const pendingHeightRef = useRef<number>(DEFAULT_CARD_HEIGHT);

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            if (!isResizing) return;

            // Dragging upward increases height; dragging downward decreases it.
            const deltaY = event.clientY - dragStartYRef.current;
            const nextHeight = dragStartHeightRef.current - deltaY;
            const viewportMax = Math.max(MIN_CARD_HEIGHT, window.innerHeight - 80);
            const clampedHeight = Math.max(MIN_CARD_HEIGHT, Math.min(nextHeight, Math.min(MAX_CARD_HEIGHT, viewportMax)));
            pendingHeightRef.current = clampedHeight;
            if (rafIdRef.current == null) {
                rafIdRef.current = window.requestAnimationFrame(() => {
                    setCardHeight(pendingHeightRef.current);
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
    }, [isResizing]);

    const onResizeStart = (event: React.MouseEvent) => {
        event.preventDefault();
        dragStartYRef.current = event.clientY;
        dragStartHeightRef.current = cardHeight;
        setIsResizing(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
    };

    return { cardHeight, isResizing, onResizeStart };
};

export default useResize;
