import { useEffect, useRef, useState } from 'react';

type ElementSize = {
  width: number;
  height: number;
};

type UseElementSizeReturn<T extends HTMLElement> = {
  containerRef: React.RefObject<T | null>;
  size: ElementSize;
};

const useElementSize = <T extends HTMLElement = HTMLDivElement>(): UseElementSizeReturn<T> => {
  const containerRef = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update(); // initial size

    const observer = new ResizeObserver(() => update());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}

export default useElementSize;