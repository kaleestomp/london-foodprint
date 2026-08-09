const isDroppedOnMap = (mapRect: DOMRect, point: { x: number; y: number }) => {
    
    const droppedOnMap =
      point.x >= mapRect.left && point.x <= mapRect.right &&
      point.y >= mapRect.top && point.y <= mapRect.bottom;

    return droppedOnMap;
};

export default isDroppedOnMap;